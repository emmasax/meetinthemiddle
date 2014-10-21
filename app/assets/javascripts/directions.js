$(function() {
  // var TEST_MODE = true;
  var TEST_MODE = false;

  var directionsDisplay,
      directionsService = new google.maps.DirectionsService(),
      map,
      input1 = document.getElementById("place1"),
      input2 = document.getElementById("place2"),
      autocompleteFrom = new google.maps.places.Autocomplete(input1),
      autocompleteTo = new google.maps.places.Autocomplete(input2),
      marker,
      infowindow = new google.maps.InfoWindow(),
      totalDist = 0,
      totalTime = 0,
      currentZoom = 10,
      listener,
      placesList = $('<ul class="places-list"></ul>'),
      markersList = [],

  initialize = function() {
    showMap();
    autocompletePlaces();
    getDirections();
    otherSetup();
  },

  otherSetup = function() {
    $('.edit').on('click', function() {
      $('.locations').addClass('open');
    });

    // check if come from share link
    // if(window.location.hash != null) {
    //   formSetup = window.location.hash;
    //   formSetupArray = formSetup.split('&');
    //   place1 = formSetupArray[0].split('=')[1];
    //   $('#place1').val(place1);
    //   place2 = formSetupArray[1].split('=')[1];
    //   $('#place2').val(place2);
    //   mode = formSetupArray[2].split('=')[1];
    //   type = formSetupArray[3].split('=')[1];
    //   $('.locations').addClass('showing-directions');
    // }
  },

  showMap = function() {
    var mapCentre = new google.maps.LatLng(51.5072, 0.1275);
    var mapOptions = {
      zoom: currentZoom,
      center: mapCentre
      // scrollwheel: false,
      // disableDefaultUI: true
    };
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    polyline = new google.maps.Polyline({
      path: [],
      strokeColor: '#FF0000',
      strokeWeight: 3
    });
  },

  autocompletePlaces = function() {
    autocompleteFrom.bindTo("bounds", map);
    autocompleteTo.bindTo("bounds", map);
    google.maps.event.addListener(autocompleteFrom, "place_changed", function() {
      $("#place1").attr("data-lat-long", autocompleteFrom.getPlace().geometry.location.lat() + " " + autocompleteFrom.getPlace().geometry.location.lng());
    });
    google.maps.event.addListener(autocompleteTo, "place_changed", function() {
      $("#place2").attr("data-lat-long", autocompleteTo.getPlace().geometry.location.lat() + " " + autocompleteTo.getPlace().geometry.location.lng());
    });
  },

  getDirections = function() {
    $(".locations .btn").on("click", function() {
      $('.error').removeClass('error');
      if(!TEST_MODE && ($(input1).val() == '' || $(input2).val() == '')) {
        if($(input1).val() == '') {
          $(input1).addClass('error');
        }
        if($(input2).val() == '') {
          $(input2).addClass('error');
        }
      }
      else {
        directionsDisplay = new google.maps.DirectionsRenderer();
        directionsDisplay.setMap(map);
        calcRoute();
      }
    });
  },

  calcRoute = function() {
    var selectedMode = document.getElementById('travelMode').value;

    if(TEST_MODE) {
      origin = "51.5154985 -0.17588420000004135";
      destination = "51.5263219 -0.08429820000003474";
    }
    else {
      if(typeof $(input1).data("lat-long") === 'undefined') {
        origin = $(input1).val();
      }
      else {
        origin = $(input1).data("lat-long");
      }
      if(typeof $(input2).data("lat-long") === 'undefined') {
        destination = $(input2).val();
      }
      else {
        destination = $(input2).data("lat-long");
      }
    }

    var request = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode[selectedMode]
    };
    directionsService.route(request, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        polyline.setPath([]);
        directionsDisplay.setDirections(result);
        $(".locations").addClass("showing-directions");

        startLocation = new Object();
        endLocation = new Object();
        var bounds = new google.maps.LatLngBounds();
        var path = result.routes[0].overview_path;
        var legs = result.routes[0].legs;
        for (i=0;i<legs.length;i++) {
          if (i == 0) {
            startLocation.latlng = legs[i].start_location;
            startLocation.address = legs[i].start_address;
            // marker = createCustomMarker(legs[i].start_location, "<b>The middle is:</b><br/>" + legs[i].start_address, "");
          }
          endLocation.latlng = legs[i].end_location;
          endLocation.address = legs[i].end_address;
          var steps = legs[i].steps;
          for (j=0;j<steps.length;j++) {
            var nextSegment = steps[j].path;
            for (k=0;k<nextSegment.length;k++) {
              polyline.getPath().push(nextSegment[k]);
              bounds.extend(nextSegment[k]);
            }
          }
        }
        polyline.setMap(map);
        computeTotalDistance(result);
      }
    });
  },

  computeTotalDistance = function(result) {
    totalDist = 0;
    totalTime = 0;
    var myroute = result.routes[0];
    for (i = 0; i < myroute.legs.length; i++) {
      totalDist += myroute.legs[i].distance.value;
      totalTime += myroute.legs[i].duration.value;
    }
    putMarkerOnRoute(50);
    totalDist = totalDist / 1000;
  },

  putMarkerOnRoute = function(percentage) {
    var distance = (percentage/100) * totalDist;
    var time = ((percentage/100) * totalTime/60).toFixed(2);
    if (!marker) {
      marker = createCustomMarker(polyline.GetPointAtDistance(distance), "", "");
    }
    else {
      marker.setPosition(polyline.GetPointAtDistance(distance));
      marker.setTitle("The Middle");
    }
    searchForMeetingPlace(marker);
  },

  createCustomMarker = function(latlng, label, html) {
    var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      title: label,
      zIndex: 1000000000000,
      icon: "http://maps.google.com/mapfiles/marker_orange.png"
    });
    marker.myname = label;
    // google.maps.event.addListener(marker, 'click', function() {
    //   infowindow.setContent(label + ' ' + html);
    //   infowindow.open(map, marker);
    // });
    return marker;
  }

  searchForMeetingPlace = function(midPoint) {
    var placeType = document.getElementById('placeType').value;

    var request = {
      location: midPoint.getPosition(),
      radius: '500',
      keyword: placeType
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, showPlaces);
  },

  showPlaces = function(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        var place = results[i];
        createMarker(results[i], i);
      }
      $('body').append(placesList).append('<div class="info-bar"><a href="#" class="show-places">Show <i class="non-mobile">as a list</i><i class="mobile">on a map</i></a> <button class="btn btn-small new-search">Search again</button><span class="logo">Let\'s meet in the middle</span></div>');

      $('.places-list li').on('click', function() {
        var ref = $(this).data('marker-id');
        google.maps.event.trigger(markersList[ref], 'click')
      });

      $('.show-places').on('click', function() {
        $('.places-list').toggleClass('open');
        if($(this).text() == "Show as a liston a map") {
          $(this).html('<i class="non-mobile">Hide list of places</i><i class="mobile">Show as a list</i>');
          if($(window).innerWidth() < 500) {
            $('.places-list').hide();
            $('#map-canvas').show();
            map.setCenter(markersList[0].getPosition());
            map.setZoom(15);
          }
        }
        else {
          $(this).html('Show <i class="non-mobile">as a list</i><i class="mobile">on a map</i>');
          if($(window).innerWidth() < 500) {
            $('.places-list').show();
            $('#map-canvas').hide();
          }
        }
      });

    }
    else {
      console.log(status)
      $('body').append('<div class="info-bar"><span>Sorry, no places found to meet</span><button class="btn btn-small new-search">Search again</button><span class="logo">Let\'s meet in the middle</span></div>');
    }
    $('body').addClass('searched');
    $('.new-search').on('click', function() {
      window.location.reload();
    });
  },

  createMarker = function(place, index) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location
    });

    // write to list
    // console.log(place)
    placesList.append('<li data-marker-id="' + index + '">' + (index+1) + '. ' + place.name + '<span>' + place.vicinity + '</span></li>');
    markersList[index] = marker;

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(place.name);
      infowindow.open(map, this);
      if(map.getZoom() != 16) {
        map.setCenter(marker.getPosition());
      }
      map.setZoom(16);
    });
  };

  google.maps.event.addDomListener(window, "load", initialize);

});









