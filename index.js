const axios = require('axios');
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser')

const PORT = 3001;
const HOST = '0.0.0.0';
const GoogleAPIKey = 'AIzaSyAwkvLfvQwFowxF7_WyMuMC1hLvXGz4Tg0';

const retrieveAmazonZone = () =>
  axios.get('https://ip-ranges.amazonaws.com/ip-ranges.json').then(response => 
    response.data.prefixes.reduce((inital, IP) => {
      let modifyEntry = {};
      
      if (IP.region !== 'GLOBAL') {
        modifyEntry[IP.region] = IP.ip_prefix.split('/')[0];
      }

      return Object.assign({}, inital, modifyEntry);    
    }, {})
  );

const IPLongLat = (ip = '') => 
  axios.get(('https://ipinfo.io/' + ip + '/json')).then(response => {
    console.log('Retrieved IP: ', ip);
    if (!Object.prototype.hasOwnProperty.call(response, 'error')) {
      return {
        Latitude: parseFloat(response.data.loc.split(',')[0]),
        Longitude: parseFloat(response.data.loc.split(',')[1]),
      }
    }

    return new Error(JSON.stringify(response));
  }).catch(err => console.log(err));
  
const DistanceBetweenPoints = (Item1, Item2) => {
  const radian = Math.PI / 180;
  const c = Math.cos;
  const Diameter = 12742; // Diameter of the earth. Please adjust for Mars if necessary 
  let Intermediate = 0.5 - c((Item2.Latitude - Item1.Latitude) * radian)/2 + 
                     c(Item1.Latitude * radian) * c(Item2.Latitude * radian) * 
                     (1 - c((Item2.Longitude - Item1.Longitude) * radian))/2;

  return Diameter * Math.asin(Math.sqrt(Intermediate));
}

const Average = ArrayInts => // Return the average value of an array of numbers
  (ArrayInts.reduce((Sum, Value) => Sum + Value, 0))/(ArrayInts.length);

const SortClosest = (LocationA, LocationB) => {
  if (LocationA.AverageDistanceToUser < LocationB.AverageDistanceToUser) {
    return -1;    
  }

  if (LocationA.AverageDistanceToUser > LocationB.AverageDistanceToUser) {
    return 1;    
  }
  
  return 0;
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/search', function (req, res) {
  const UserLocations = req.body;

  retrieveAmazonZone().then(zones => 
    Promise.all(Object.keys(zones).map(zoneID => 
      IPLongLat(zones[zoneID]).then(IPData => 
        Object.assign({}, IPData, {
          zoneID,
        })
      )
    ))
  ).then(ZoneLocations =>     
    ZoneLocations.map(Location =>  // Inject Average distnace
      Object.assign({}, Location, {
        AverageDistanceToUser: Average(
          UserLocations.map(UserLocation => 
            DistanceBetweenPoints(Location, UserLocation)
          )
        ),
      })
    )
  ).then(data => res.send(data.sort(SortClosest))); // Return Sorted array
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);