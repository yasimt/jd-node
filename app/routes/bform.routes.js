function initiator(router, app) {
  app.use("/jdboxNode/bform", router);

  const bformCntlr = require(__basedir + "/app/controllers/bform.controller");

  router.get("/test", (req, res) => res.json({msg: "Bform Works"}));
  router.post("/tempdetails", bformCntlr.tempDetails);
  router.post("/dndinfo", bformCntlr.dndInfo);
  router.post("/stateinfo", bformCntlr.getStateInfo);
  router.post("/cityinfo", bformCntlr.getCityInfo);
  router.post("/cityautosuggest", bformCntlr.cityAutoSuggest);
  router.post("/streetinfo", bformCntlr.getStreetInfo);
  router.post("/areainfo", bformCntlr.getAreaInfo);
  router.post("/areaautosuggest", bformCntlr.areaAutoSuggest);
  router.post("/landmarkinfo", bformCntlr.getLandmarkInfo);
  router.post("/stdcodeinfo", bformCntlr.getStdCodeInfo);
  router.post("/pincodeinfo", bformCntlr.getPincodeInfo);
  router.post("/pincodelookup", bformCntlr.getPincodeLookup);
  router.post("/imagedetails", bformCntlr.imageDetails);
  router.post("/sourcewisedupchk", bformCntlr.sourceWiseDuplicacyChk);
  router.post("/correctincorrectinfo", bformCntlr.correctIncorrectInfo);
  router.post("/narrationinfo", bformCntlr.getNarrationInfo);
  router.post("/paymentnarrationInfo", bformCntlr.paymentNarrationInfo);
  router.post("/sendapplink", bformCntlr.sendAppLink);
  router.post("/sendtvadlink", bformCntlr.sendTvAdLink);
  router.post("/sendtvadnapplink", bformCntlr.sendTvAdNAppLink);
  router.post("/mandateinfo", bformCntlr.getMandateinfo);
  router.post("/getContractType", bformCntlr.checkLeadContract);
  router.post("/updateclientinfo", bformCntlr.updateClientInfo);
  router.post("/iroapptransfer", bformCntlr.iroAppTransfer);
  router.post("/iroappsavenexit", bformCntlr.iroAppSaveNExit);
  router.post("/iroappproceed", bformCntlr.iroAppProceed);
  router.post("/pincodechangelog", bformCntlr.pincodeChangeLog);
  router.post("/areapincoderequest", bformCntlr.areaPincodeRequest);
  router.post("/mobilefeedback", bformCntlr.insertMobileFeedback);
  router.post("/addsuggestedcity", bformCntlr.addSuggestedCity);
  router.post("/correct_incorrect_update", bformCntlr.corrIncorrUpdate);
  router.post("/checkentryecslead", bformCntlr.checkEntryEcsLead);
  router.post("/estimatedsearchlink", bformCntlr.estimatedSearchInfo);
  router.post("/matchedactivedata", bformCntlr.getMatchedActiveData);
  router.post("/irocardinfo", bformCntlr.iroCardInfo);

  router.post("/webdialerallocation", bformCntlr.webDialerAllocation);
  router.post("/phonesearchallocation", bformCntlr.phoneSearchAllocation);

  router.post("/ecstransferinfo", bformCntlr.jdpayEcsPopup); // both are same
  router.post("/ecsEscalationDetails", bformCntlr.ecsEscalationDetails);

  router.post("/building_autocomplete", bformCntlr.buildingAutoComplete);
  router.post("/fetch_restaurant_info", bformCntlr.fetchRestaurantInfo);
  router.post("/jdpay_ecs_popup", bformCntlr.jdpayEcsPopup);
  router.post("/ecs_trans_details_update", bformCntlr.ecsTransDetailsUpdate);
  router.post("/fetchecsdetails", bformCntlr.fetchECSDetails);
  router.post("/getalltme", bformCntlr.getAllTME);
  router.post("/ecssendupgraderequest", bformCntlr.ecsSendUpgradeRequest);
  router.post("/updateretentiontmeinfo", bformCntlr.updateRetentionTmeInfo);
  router.post("/updaterepeatcount", bformCntlr.updateRepeatCount);
  router.post("/mktgBarLoad", bformCntlr.mktgBarLoad);
  router.post("/idgenerator", bformCntlr.idGeneratorData);
  router.post("/tmesearchdata", bformCntlr.getTmeSearchData);
  router.post("/chkRatingCat", bformCntlr.chkRatingCat);
  router.post("/insertDeliveredCaseInfo", bformCntlr.insertDeliveredCaseInfo);
  router.post("/setversion", bformCntlr.setVersion);
  router.post("/latlong", bformCntlr.getGeocode);
  router.post("/sendeditlistinglink", bformCntlr.sendEditListingLink);
  router.post("/get-temp-data", bformCntlr.getConTempData); // only for TME
  router.post("/get-live-data", bformCntlr.getConLiveData); // for TME & ME
  router.post("/get-loc-data", bformCntlr.getLocData); // for TME & ME
  /*
  router.use("*", (req, res) =>
    res.json({errors: {code: 1, msg: "No Such B-Form Route Exists"}})
  );
  app.use((err, req, res, next) => {
    if (err) {
      res.json({errors: {code: 1, msg: err}});
    }
  });*/
}
module.exports = initiator;
