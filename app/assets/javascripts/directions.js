$(function() {
  // var TEST_MODE = true;
  var TEST_MODE = false;

  var directionsDisplay,
      directionsService,
      map,
      input1,
      input2,
      marker,
      totalDist = 0,
      totalTime = 0,
      listener,
      placesList,
      markersList = [],
      autocompleteFrom,
      autocompleteTo,
      infowindow,
      mapCentre,
      region,
      currentZoom,

  initialize = function() {
    input1 = document.getElementById("place1"),
    input2 = document.getElementById("place2"),
    placesList = $('.places-list'),
    directionsService = new google.maps.DirectionsService(),
    autocompleteFrom = new google.maps.places.Autocomplete(input1),
    autocompleteTo = new google.maps.places.Autocomplete(input2),
    infowindow = new google.maps.InfoWindow({maxWidth: 200}),
    mapCentre = new google.maps.LatLng(51.5072, 0.1275);
    getUserLocation();
  },

  otherSetup = function() {
    // map loaded
    $('body').addClass('map-loaded');

    $('.edit').on('click', function() {
      $('.locations').addClass('open');
    });

    $('form').on("submit", function(ev) {
      ev.preventDefault();
      if(!(typeof ga === "undefined")) {
        ga('send', 'event', 'form', 'submitted');
      }
      getDirections();
    });

    $('.new-search').on('click', function() {
      window.location.hash = "";
      window.location.reload();
    });

    autocompletePlaces();

    // check if user has got a share link
    if(window.location.hash != '') {
      formSetup = window.location.hash;
      formSetupArray = formSetup.split('&');
      if(formSetupArray.length == 3) {
        optionOrigin = formSetupArray[0].split('=')[1];
        $('#place1').val(optionOrigin);
        optionDestination = formSetupArray[1].split('=')[1];
        $('#place2').val(optionDestination);
        optionTransit = formSetupArray[2].split('=')[1];
        $('#travelMode').val(optionTransit);
        if(optionOrigin != '' && optionDestination != '' && optionTransit != '') {
          getDirections();
        }
        else {
          $('.locations h1').after('<p class="error">Sorry, some routing information is missing.</p>');
        }
      }
      else {
        $('.locations h1').after('<p class="error">Sorry, some routing information is missing.</p>');
      }
    }
  },

  displayMap = function() {
    var mapOptions = {
      zoom: 10,
      center: mapCentre
    };
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    polyline = new google.maps.Polyline({
      path: [],
      strokeColor: '#FF0000',
      strokeWeight: 3
    });
    otherSetup();
  },

  getUserLocation = function() {
    // display the map if there is an error or geolocation not supported - just use default lat lng
    var success = function(position) {
      mapCentre = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      displayMap();
    },
    error = function(msg) {
      displayMap();
    };

    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    }
    else {
      // error('not supported');
      displayMap();
    }

    // get country code
    jQuery.ajax( {
      url: '//freegeoip.net/json/',
      type: 'POST',
      dataType: 'jsonp',
      success: function(location) {
        region = location.country_code;
      }
    });
  },

  autocompletePlaces = function() {
    autocompleteFrom.bindTo("bounds", map);
    autocompleteTo.bindTo("bounds", map);

    google.maps.event.addListener(autocompleteFrom, "place_changed", function() {
      var geometry = autocompleteFrom.getPlace().geometry;
      if(!(typeof geometry  === 'undefined')) {
        $("#place1").attr("data-lat-long", geometry.location.lat() + " " + geometry.location.lng());
      }
    });
    google.maps.event.addListener(autocompleteTo, "place_changed", function() {
      var geometry = autocompleteTo.getPlace().geometry;
      if(!(typeof geometry  === 'undefined')) {
        $("#place2").attr("data-lat-long", geometry.location.lat() + " " + geometry.location.lng());
      }
    });
  },

  getDirections = function() {
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
      calcRoute();
    }
  },

  calcRoute = function() {
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);

    if(TEST_MODE) {
      origin = "51.5154985 -0.17588420000004135";
      destination = "51.5263219 -0.08429820000003474";
    }
    else {
      origin = $(input1).data("lat-long");
      destination = $(input2).data("lat-long");
      if(typeof origin === 'undefined') {
        origin = $(input1).val();
      }
      if(typeof destination === 'undefined') {
        destination = $(input2).val();
      }
      // console.log(origin);
      // console.log(destination);
      // console.log(region);
    }

    var selectedMode = $('input[name=travelMode]:checked').val();
    var request = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode[selectedMode],
      region: region
    };
    directionsService.route(request, function(result, status) {
      // console.log(result);
      $(".locations").addClass("showing-directions");

      if (status == google.maps.DirectionsStatus.OK) {
        polyline.setPath([]);
        directionsDisplay.setDirections(result);

        startLocation = new Object();
        endLocation = new Object();
        var bounds = new google.maps.LatLngBounds();
        var path = result.routes[0].overview_path;
        var legs = result.routes[0].legs;
        for (i=0;i<legs.length;i++) {
          if (i == 0) {
            startLocation.latlng = legs[i].start_location;
            startLocation.address = legs[i].start_address;
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
      else {
        // console.log('no routes:' + status);
        $('.info-bar').show();
      }
    });

    var hash = "#p1=" + origin + "&p2=" + destination + "&mode=" + selectedMode,
        linkToCopy = $('.share-link textarea');
    window.location.hash = hash;
    if(!(typeof ga === "undefined")) {
      ga('set', 'location', hash);
    }
    linkToCopy.text(document.URL);

    $('.share').on('click', function(ev) {
      ev.preventDefault();
      if(!(typeof ga === "undefined")) {
        ga('send', 'event', 'button', 'clicked', 'get share link');
      }
      $('.share-link').toggleClass('open');
      linkToCopy.focus().select();
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
      marker = createCustomMarker(polyline.GetPointAtDistance(distance), "", "<br/>Approximately " + time + " minutes to this point");
    }
    else {
      marker.setPosition(polyline.GetPointAtDistance(distance));
    }
    // center mid point on the map
    google.maps.event.addListener(map, 'idle', function() {
      currentZoom = map.getZoom();
      map.setCenter(marker.getPosition());
      google.maps.event.clearListeners(map, 'idle');
    });
    searchForMeetingPlace(marker, totalDist);
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

    google.maps.event.addListener(marker, 'click', function() {
      console.log(marker);
      infowindow.setContent("<b>The middle</b> " + html);
      infowindow.open(map, this);
      var newZoom = currentZoom + 3;
      if(map.getZoom() != newZoom) {
        map.setCenter(marker.getPosition());
      }
      map.setZoom(newZoom);
    });

    return marker;
  }

  searchForMeetingPlace = function(midPoint, totalDist) {
    var radius = ((0.05 * totalDist) < 1000) ? 1000 : 0.05 * totalDist;
    // console.log(radius);
    var request = {
      location: midPoint.getPosition(),
      radius: radius,
      keyword: "coffee restaurant bar"
    };
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, showPlaces);
  },

  showPlaces = function(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      if(!(typeof ga === "undefined")) {
        ga('send', 'event', 'places', 'displayed', document.URL);
      }

      for (var i = 0; i < results.length; i++) {
        var place = results[i];
        createMarker(results[i], i);
      }
      var showPlacesText = 'Show <i class="non-mobile">as a list</i><i class="mobile">on a map</i>',
          hidePlacesText = '<i class="non-mobile">Hide list of places</i><i class="mobile">Show as a list</i>';

      $('.info-bar .empty').replaceWith('<a href="#" class="show-places">' + showPlacesText + '</a>');

      $('.places-list li').on('click', function() {
        var ref = $(this).data('marker-id');
        google.maps.event.trigger(markersList[ref], 'click')
      });

      $('.show-places').on('click', function() {
        if(!(typeof ga === "undefined")) {
          ga('send', 'event', 'button', 'clicked', 'show places list');
        }

        $('.places-list').toggleClass('open');
        if($(this).text() == "Show as a liston a map") {
          $(this).html(hidePlacesText);
          if($(window).innerWidth() < 500) {
            $('.places-list').hide();
            $('#map-canvas').show();
            map.setCenter(markersList[0].getPosition());
            map.setZoom(map.getZoom() + 3);
          }
        }
        else {
          $(this).html(showPlacesText);
          if($(window).innerWidth() < 500) {
            $('.places-list').show();
            $('#map-canvas').hide();
          }
        }
      });

    }
    else {
      // console.log('no places:' + status)
      $('.info-bar').show();
      $('.empty').text('Sorry, no places to meet');
    }
    $('body').addClass('searched');
  },

  createMarker = function(place, index) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location
    });

    // write to list
    placesList.append('<li data-marker-id="' + index + '">' + (index+1) + '. ' + place.name + '<span>' + place.vicinity + '</span></li>');
    markersList[index] = marker;

    google.maps.event.addListener(marker, 'click', function() {
      // look up some more info about that marker
      var request = {
        placeId: place.place_id
      };
      marker = this;
      service1 = new google.maps.places.PlacesService(map);
      service1.getDetails(request, function(place, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          var photo = "";
          if(!(typeof place.photos === "undefined")) {
            photo = "<img src=" + place.photos[0].getUrl({maxWidth: 200, maxHeight: 150}) + " width='150' height='150' />"
          }
          infowindow.setContent(photo+"<p><b>" + place.name + "</b></p><p>" + place.formatted_address + "</p><p>" + place.formatted_phone_number + "</p><p><a href='" + place.website + "' target='_blank'>Visit website</a></p>");
          infowindow.open(map, marker);
          var newZoom = currentZoom + 3;
          if(map.getZoom() != newZoom) {
            map.setCenter(marker.getPosition());
          }
          map.setZoom(newZoom);
        }
      });

    });
  };

  if($('body.map').length > 0) {
    google.maps.event.addDomListener(window, "load", initialize);
  }

  // always prevent form submit
  $('body:not(.map-loaded) form').on("submit", function(ev) {
    ev.preventDefault();
  });

});