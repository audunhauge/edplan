// funksjoner for å registrere/vise starbkurs


function starbkurs(room,delta,makeres) {
    var s = '<div class="sized1 centered gradback">'
            + '<h1 id="oskrift"></h1>'
            + '<div id="makeres" class="sized25 textcenter centered" >'
            + '  Kursinfo:<br> <textarea id="restext"></textarea></label>'
            + '  <div id="saveres" class="button float gui" >Lagre</div>'
            + '  <br>teach <input id="saveres" type="text" />'
            + '  <br>rom <input id="saveres" type="text" />'
            + '  <br>dag <input id="saveres" type="text" />'
            + '</div><br>' 
            + '</div>';
  $j("#main").html(s);

}

