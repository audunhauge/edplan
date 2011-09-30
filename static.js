// static data that doesnt need to be stored i db
//   list of rooms


var roomliste = {"A" :("A001,A002,A003,A005,A102,A107".split(',')),
                 "B" :("B001,B002".split(',')),
                 "M0":("M001,M002,M003,M004,M005,M006".split(',')),
                 "M1":("M106,M109,M110,M111,M112,M113,M117,M118,M119,B001,B002".split(',')),
                 "R0":("R001,R002,R003,R004,R005,R008".split(',')),
                 "R1":("R105,R106,R107,R110,R111,R112,R113".split(',')),
                 "R2":("R201,R202,R203,R204,R205,R206,R207,R208,R210,R211,R212,R213,R214,R215,R216".split(',')) };

var allrooms = [];
(function () {
  for (var gr in roomliste) {
    var grr = roomliste[gr];
    for (var id in grr) {
      var navn = grr[id];
      allrooms.push(navn);
    }
  }
})();

// standard timeslots for lesson-slots
var slotlabels = '8.05-8.45,8.45-9.25,9.35-10.15,10.20-11.00,11.25-12.05,12.10-12.50,12.50-13.30,'
               + '13.40-14.20,14.25-15.05,15.05-15.30,15.30-16.00,16.00-16.30,16.30-17.00,17.00-17.30,'
               + '17.30-18.00,18.00-18.30,18.30-19.00,19.00-19.30,19.30-20.00,20.00-20.30,20.30-21.00';

var romnavn = [ "A001", "A002", "A003", "A005","A102","A107","B001", "B002", "G001", "G002", "G003", "G004", "M001", "M002",
                "M003", "M004", "M005", "M006", "M100", "M101", "M102", "M103", "M104", "M105", "M106", "M107", "M108", "M109","M110",
                "M111", "M112", "M113", "M114", "M115", "M116", "M117", "M118", "M119", 
                "R001", "R002", "R003", "R004", "R005", "R006", "R008", "R102", "R105", "R106", "R107", "R110", "R112", "R113",
                "R117", "R201", "R202", "R203", "R204", "R205", "R206", "R207", "R208", "R209", "R210", "R211", "R212", "R213",
                "R214", "R215", "R216", "RAULA", "SAL1", "SAL2", "SAL3" ];
var rnavn2id ={ "A001":"2", "A002":"3", "A003":"4", "A005":"77","A102":"80", "A107":"79", "B001":"7", "B002":"74", "G001":"9", "G002":"10",
                "G003":"11", "G004":"12", "M001":"13", "M002":"14", "M003":"15", "M004":"16", "M005":"17", "M006":"18", "M100":"19",
                "M101":"20", "M102":"21", "M103":"22", "M104":"23", "M105":"24", "M106":"25", "M107":"26", "M108":"27", "M110":"28",
                "M111":"29", "M112":"30", "M113":"31", "M114":"32", "M115":"33", "M116":"34", "M117":"35", "M118":"36", "M119":"37",
                "R001":"39", "R002":"40", "R003":"41", "R004":"42", "R005":"43", "R006":"44", "R008":"45", "R102":"46", "R105":"47", "R106":"48",
                "R107":"49", "R110":"50", "R112":"51", "R113":"52", "R117":"53", "R201":"54", "R202":"55", "R203":"56", "R204":"57", "R205":"58",
                "R206":"59", "R207":"60", "R208":"61", "R209":"62", "R210":"63", "R211":"64", "R212":"65", "R213":"66", "R214":"67", "R215":"68",
                "R216":"69", "RAULA":"70", "SAL1":"71", "SAL2":"72", "SAL3":"73", "M109":"81" };
    
    
               

var roominfo = {};
roominfo["M119"] = { info:'Konsertsal', days:7, slots:21, slabels:slotlabels, restrict:"LEST,BRER,HAAU".split(',') };
roominfo["B001"] = { info:'Blackbox', days:7, slots:21, slabels:slotlabels, restrict:"GRRO,ARSI,HAGR,UTKJ,HOLI,SAEL,ANNU,KVRU,LEST,BRER,HAAU".split(',') };
roominfo["B002"] = { info:'Blackbox', days:7, slots:21, slabels:slotlabels, restrict:"GRRO,ARSI,HAGR,UTKJ,HOLI,SAEL,ANNU,KVRU,LEST,BRER,HAAU".split(',') };
roominfo["A102"] = { info:'Grupperom' };
roominfo["A107"] = { info:'Grupperom/Karrieresenter' };
roominfo["A001"] = { info:'Lesesal' };
roominfo["A005"] = { info:'Grupperom' };
roominfo["R113"] = { info:'Grupperom/Møterom' };
//console.log(roominfo);
module.exports.roomdata = { roomliste:roomliste, allrooms:allrooms, slotlabels:slotlabels, roominfo:roominfo, romnavn:romnavn, rnavn2id:rnavn2id };
