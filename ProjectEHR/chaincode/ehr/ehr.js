const shim = require('fabric-shim');
const util = require('util');

var EHRecord = class {

  // Initialize the chaincode
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Instantiated  Chaincode ===========');
    return shim.success();

  }
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.success();
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async publishRecord(stub, args,thisClass) {
    if (args.length != 8) {
      throw new Error('Incorrect number of arguments. Expecting 8');
    }

	 let UID = args[0];
     let NAME = args[1];
     let PATIENTID = args[2];
     let AGE = args[3];
     let GENDER = args[4];
     let PRESCRIPTION = args[5];
     let DOCTORNAME = args[6];
     let AMOUNT = args[7];
	 
	  let Record = {};
		Record.docType = 'EHR';
		Record.UID = UID;
		Record.NAME = NAME;
		Record.PATIENTID = PATIENTID;
		Record.AGE = AGE;
		Record.GENDER = GENDER;
		Record.PRESCRIPTION = PRESCRIPTION;
		Record.DOCTORNAME = DOCTORNAME;
		Record.AMOUNT = AMOUNT;
	

    await stub.putState(UID, Buffer.from(JSON.stringify(Record)));

  }

  // Deletes an entity from state

  async verifyRecord(stub, args,thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the person to query')
    }

    let UID = args[0];
  
    let result = await stub.getState(UID); 
    if (!result.toString()) {
      let jsonResp = {};
      jsonResp.Error = ' no record found' ;
      throw new Error(JSON.stringify(jsonResp));
    }
   
    return result;
  }
async getHistory(stub, args, thisClass) {

    let UID = args[0];
    let resultsIterator = await stub.getHistoryForKey(UID);
    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, true);

    return Buffer.from(JSON.stringify(results));
  }
  
   async getAllResults(iterator, isHistory) {
    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        if (isHistory && isHistory === true) {
          jsonRes.TxId = res.value.tx_id;
          jsonRes.Timestamp = res.value.timestamp;
          jsonRes.IsDelete = res.value.is_delete.toString();
          try {
            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Value = res.value.value.toString('utf8');
          }
        } else {
          jsonRes.Key = res.value.key;
          try {
            jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Record = res.value.value.toString('utf8');
          }
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }
  
};

shim.start(new EHRecord());
