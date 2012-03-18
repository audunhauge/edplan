// manage and create courses
// create new course
// change course
// add teachers to course
// add studs to course


function managecourse() {
  // create a course manager page
  var s = '<h1>Coursemanager</h1>';
  s += ''
  + '<div id="cmanager" class="border1 sized1 gradback centered">'  
  + ' <div id="leftmenu">'  
  + '  <ul>'
  + '   <li><a id="newgroup" class="action" href="#">Add new group</a></li>'
  + '   <li><a id="altergroup" class="action" href="#">edit group</a></li>'
  + '   <li><a id="newcourse" class="action" href="#">Add new course</a></li>'
  + '   <li><a id="altercourse" class="action" href="#">Edit course</a></li>'
  + '   <ul>'
  + '     <li><a id="teach" class="action" href="#">teachers</a></li>'
  + '     <li><a id="stud" class="action" href="#">students</a></li>'
  + '   </ul>'
  + '   <li><a id="killcourse" class="action" href="#">Delete course</a></li>'
  + '  </ul>'
  + ' </div>'
  + ' <div id="stage">'
  + '   <h3> here comes som text</h3>'
  + ' </div>'
  + '</div>';
  $j("#main").html(s);
  $j("#newcourse").click(function(event) {
      event.preventDefault();
      add_course();
  }); 
  $j("#altercourse").click(function(event) {
      event.preventDefault();
      change_course();
  });
  $j("#newgroup").click(function(event) {
      event.preventDefault();
      add_group();
  }); 
  $j("#altergroup").click(function(event) {
      event.preventDefault();
      change_group();
  });
  $j("#teach").click(function(event) {
      event.preventDefault();
      teach();
  });
  $j("#stud").click(function(event) {
      event.preventDefault();
      stud();
  });

}


function add_course() {
  var save = '<div id="savenew" class="float button">Save</div>';
  var cat  = '<select id="category" name="category">'
   + '<option value="2">Vg1</option>'
   + '<option value="3">Vg2</option>'
   + '<option value="4">Vg4</option>'
   + '<option value="10">MDD</option>'
   + '</select>';
  var s = '<form><table id="form"><tr><td><label>Coursename</label></td><td> <input id="coursename" type="text" value="" size="20"></td></tr>'
  + '  <tr><td>Category</td><td>'+cat+' </td></tr>'
  + '  <tr><td>'+save+'</td><td></td></tr>'
  + '</table></form>';
  $j("#stage").html(s);
  $j("#savenew").click(function(event) {
      var category = $j("#category").val();
      var coursename = $j("#coursename").val();
      $j.post( "/create_course", { category:category, coursename:coursename } ,
      function(data) {
          if (data.ok) {
              $j("#stage").html(data.msg);
          } else {    
              $j("#stage").html('<span class="error">'+data.msg+'</span>');
          }
      });

  });
}

function change_course() {
  var save = '<div id="savenew" class="float button">Save</div>';
  var cat  = '<select id="category" name="category">'
   + '<option value="2">Vg1</option>'
   + '<option value="3">Vg2</option>'
   + '<option value="4">Vg4</option>'
   + '<option value="10">MDD</option>'
   + '</select>';
  var s = '<form><table id="form">'
  + ' <tr><td><label>Choose course</label></td><td><div id="selector"></div></td></tr>'
  + ' <tr><td><label>Teachers</label></td><td><div id="teachlist"></div></td></tr>'
  + ' <tr><td><label>Studs</label></td><td><div id="studlist"></div></td></tr>'
  + '</table></form>';
  $j("#stage").html(s);
   var s = '';
   s += '<select id="css" name="ccs">'
   for (var i in courseplans) {
     s += '<option >' + i + '</option>';
   }
   s += '</select>';
   $j("#selector").html(s);
   $j("#css").change(function(event) {
        var coursename = $j(this).val();
        var group = coursename.split('_')[1];
        var s = '';
        for (var i in database.memlist[group]) {
           var  enr = database.memlist[group][i];
           if (students[enr]) {
             s += students[enr].username + ' ' ;
           }
        }
        $j("#studlist").html(s);
        //$j("#teachlist").html(s);
      });

}


function teach() {
  studChooser("#stage",teachers,{});
  $j(".tnames").click(function () {
          alert(+this.id.substr(2));
       });
}

function stud() {
  studChooser("#stage",students,{});
  $j(".tnames").click(function () {
          alert(+this.id.substr(2));
       });
}


function studChooser(targetdiv,memberlist,info,tabfield,fieldlist,mapping) {
    // targetdiv is id of div where the studChooser is to be displayed
    // memberlist is hash of members to show
    // info has a count for each member (or undefined for a member)
    //   members with info will be showed with green color and the count
    //   if count == 0 then only green color
    tabfield = typeof(tabfield) != 'undefined' ? tabfield : 'lastname';
    fieldlist = typeof(fieldlist) != 'undefined' ? fieldlist : { firstname:1,lastname:1,institution:1 };
    mapping = typeof(mapping) != 'undefined' ? mapping : {  };
    // gives choice of how to group by tabs
    var booklet = {};
    var studlist = [];
    var many = '';    // changed to "many" if many studs
    var cutoff = 16;   // changed to 30 if many
    var count = 0;
    var topstep = 30;  // changed to 20 if many
    var starttab = '';  // first tab to open
    var char1;
    var ii;
    var te;
    var mapp = '';
    var maplist = {};
    var join = true;
    if (mapping[tabfield]) {
      mapp = mapping[tabfield].field;
      maplist = mapping[tabfield].map;
    } else {
      for (ii in memberlist ) {
        if (!memberlist[ii][tabfield]) tabfield = 'institution';
        break;
      }
    }
    for (ii in memberlist) {
      var te = memberlist[ii];
      if (mapp) {
        var remap = te[mapp];
        char1 = maplist[remap] || te.department;
        many = "many";
        cutoff = 1;
        join = false;
        //topstep = 25;
      } else if (tabfield == 'lastname' || tabfield == 'firstname') {
        var char1 = te[tabfield].substr(0,1).toUpperCase();
      } else if (te[tabfield] ) {
        char1 = te[tabfield];
        // we most likely want all tabs
        many = "many";
        cutoff = 1;
        topstep = 25;
      } else {
        //var char1 = te['lastname'].substr(0,1).toUpperCase();
        var char1 =  te.department;
      }
      if (!booklet[char1]) {
        booklet[char1] = [];
      }
      booklet[char1].push(te);
      count++;
    }
    var tabchooser = '';
    var left = 0;
    for (var field in fieldlist ) {
      tabchooser += '<div  id="'+field+'" style="left:'+left+'px;" class="tabchooser">'+field+'</div>';
      left += 50;
    }
    if (count > 200) {
      many = "many";
      cutoff = 32;
      topstep = 20;
    }
    count = 0;
    var topp = 30;
    var sortedtabs = [];
    for (var ii in booklet) {
      sortedtabs.push(ii);
    }
    sortedtabs.sort();
    var maxsofar = 0;
    var prevcount = 0;
    var chaplist = [];
    var prevtab = '';
    for (var kk in sortedtabs) {
      var ii = sortedtabs[kk];
      var chapter = booklet[ii];
      if (join && count > cutoff || count + chapter.length > cutoff+5) {
        studlist = studlist.concat(chaplist.sort());
        chaplist = [];
        studlist.push('</div>');
        prevcount = count;
        count = 0;
      }
      if (count == 0 ) {
        studlist.push('<div id="tab'+ii+'" class="'+many+' tab char'+ii+'"  style="top:'+topp+'px;" >'+ii+'</div>' );
        studlist.push('<div id="chap'+ii+'" class="chapter char'+ii+'" >');
        topp += topstep;
        if (prevcount > maxsofar) {
          maxsofar = prevcount;
          starttab = prevtab;
        }
        prevtab = ii;
      }
      for (var jj in chapter) {
        var te = chapter[jj];
        var fullname = te.lastname+' '+te.firstname;
        if (fullname.length > 26) {
          var lastname = te.lastname + ' ';
          if (lastname > 14) {
            lastname = te.lastname.substr(0,14) + '.. ';
          }
          var firstname = te.firstname;
          if ((lastname.length + firstname.length) > 24) {
            firstname = te.firstname.substr(0,14) + '..';
          }
          fullname = lastname + firstname;
        }
        fullname = fullname.caps();
        var someabs = (info[te.id] != undefined) ? 'someabs' :  '';
        var abscount = (info[te.id]) ? info[te.id] :  '';
        chaplist.push('<div sort="'+te.lastname.toUpperCase()+'" class="'+many+' tnames '+someabs+'" id="te'+te.id+'">' + fullname + ' &nbsp; ' + abscount + '</div>');
        count++;
      }
    }
    if (starttab == '') {
      starttab = ii;
    }
    studlist = studlist.concat(chaplist.sort());
    studlist.push('</div>');
    studlist.push('</div">');
    teachul = '<div class="namebook">' +tabchooser+ studlist.join('') + '</div>';
    $j(targetdiv).html(teachul);
    $j(".tabchooser").removeClass("active");
    $j("#"+tabfield).addClass('active');
    $j(".tabchooser").click(function() {
           tabfield = this.id;
           studChooser(targetdiv,memberlist,info,tabfield,fieldlist,mapping);
       });
    $j(".chapter").hide();
    $j("#chap"+starttab).toggle();
    $j("#tab"+starttab).addClass("shadow");
    $j(".tab").click(function() {
           $j(".tab").removeClass("shadow");
           $j("#" + this.id).addClass("shadow");
           $j(".chapter").hide();
           var idd = this.id.substr(3);
           $j("#chap"+idd).toggle();
         });
}


