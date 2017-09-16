var geocoder;
var map;
var ZoneMarker = null;
var CurrentSelection = {};
var SelectedLocations = [];

function initialize() {
  geocoder = new google.maps.Geocoder();
  const CentrePoint = new google.maps.LatLng(-27.4697707, 153.0251235);
  const mapOptions = {
    zoom: 8,
    center: CentrePoint
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function handleEnter(event) { // Submit if you hit enter in the Search box
  if (event.keyCode == 13) {        
    codeAddress(); 
  }
}

function SetResults(Location) {
  if (Location !== null) {
    CurrentSelection = {
      Raw: Location,
      Longitude: Location.geometry.location.lng(),
      Latitude: Location.geometry.location.lat(),
      Name: Location.formatted_address,
    };
  } else {
    CurrentSelection = {};
  }
  
  document.getElementById('LongitudeResult').innerHTML = CurrentSelection.Longitude || '';
  document.getElementById('LatitudeResult').innerHTML = CurrentSelection.Latitude || '';
  document.getElementById('NameResult').innerHTML = CurrentSelection.Name || '';
}

function SearchSubmit() {
  if (SelectedLocations.length > 0) {
    const url = window.location.origin + "/search";
    const PostData = JSON.stringify(SelectedLocations);

    let request = new XMLHttpRequest();

    request.open("POST", url, true);
    request.setRequestHeader("Content-type", "application/json");
    request.onreadystatechange = function () { // Callback for request
      if (request.readyState === 4 && request.status === 200) {
        DisplayResults(JSON.parse(request.responseText)); // Display results to user
      }
    };
    request.send(PostData);
  } else {
    alert('Please add at least one location');
  }
}

function AddSelection () {
  if (Object.keys(CurrentSelection).length > 0) {
    new google.maps.Marker({
      map: map,
      position: CurrentSelection.Raw.geometry.location
    });

    SelectedLocations.push(CurrentSelection);
    
    document.getElementById('PlacesSelectedList').innerHTML = SelectedLocations.map(function(Location) {
      return `<li>${Location.Name}</li>`;
    }).join('');

    SetResults(null);
  }
}

function DisplayResults (Results) {
  if (Results.length > 0) {
    const regionLocation = new google.maps.LatLng(Results[0].Latitude, Results[0].Longitude);
    
    if (ZoneMarker !== null) {
      ZoneMarker.setMap(null); // Remove old Marker if present
    }

    map.setCenter(regionLocation);
    ZoneMarker = new google.maps.Marker({
      map: map,
      position: regionLocation,
      title: Results[0].zoneID,
      label: Results[0].zoneID,
      animation: google.maps.Animation.DROP,
    });
    
    document.getElementById('SortedRegionsList').innerHTML = Results.slice(0, 5).map(function(Region) {
      return `<li>${Region.zoneID}</li>`;
    }).join('');
  }
}

function codeAddress() {
  const address = document.getElementById('address').value;
  geocoder.geocode({ 'address': address}, function(results, status) {
    if (status == 'OK') {
      map.setCenter(results[0].geometry.location);
      SetResults(results[0]);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}