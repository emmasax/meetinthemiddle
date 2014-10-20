$(function() {
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
  },

  showMap = function() {
    var mapCentre = new google.maps.LatLng(51.5072, 0.1275);
    var mapOptions = {
      zoom: currentZoom,
      center: mapCentre,
      scrollwheel: false,
      disableDefaultUI: true
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
      directionsDisplay = new google.maps.DirectionsRenderer();
      directionsDisplay.setMap(map);
      calcRoute();
    });
  },

  calcRoute = function() {
    var selectedMode = document.getElementById('travelMode').value;
    var request = {
      origin: $(input1).data("lat-long"),
      destination: $(input2).data("lat-long"),
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
            marker = createCustomMarker(legs[i].start_location, "<b>The middle is:</b><br/>" + legs[i].start_address, "");
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
      marker = createCustomMarker(polyline.GetPointAtDistance(distance), "time: " + time, "marker");
    }
    else {
      marker.setPosition(polyline.GetPointAtDistance(distance));
      marker.setTitle("time:"+time);
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
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(label + ' ' + html);
      infowindow.open(map, marker);
    });
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
        createMarker(results[i]);
      }
    }
    else {
      console.log(status)
    }
  },

  createMarker = function(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(place.name);
      infowindow.open(map, this);
    });
  };

  google.maps.event.addDomListener(window, "load", initialize);

});









