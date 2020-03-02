var map;
var db;

$().ready(() => {
    // Setup DB
    db = new Dexie("covid19");

    db.version(1).stores({
        data: 'id,country,state,lat,lng,infected,recovered,dead'
    });

    // Setup Map
    map = L.map('map').setView([-41.13729606112275, 172.94677734375003], 6);

    /*L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        minZoom: 3
    }).addTo(map);*/

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        minZoom: 3
    }).addTo(map);

    // Get Data
    var lastUpdated = localStorage.getItem('lastUpdated');
    var getData = (!!lastUpdated && moment(lastUpdated) < moment(Date()).subtract(1, 'hour')) || !lastUpdated;

    if (getData) {
        $.ajax({
            url: 'https://xyz.api.here.com/hub/spaces/2LlvwPLZ/bbox?west=-180&north=90&east=180&south=-90&access_token=ABp7U3fwSf6D0QSkcrP4_AA',
            success: (data) => {
                var data = processData(data);
                db.data.bulkPut(data).then(() => {
                    plotData();
                });
                localStorage.setItem('lastUpdated', Date());
            }
        });
    }
    else {
        plotData();
    }
});

function processData(response) {
    var output = [];

    response.features.forEach(e => {
        // Declare model
        var data = {
            id: null,
            country: null,
            state: null,
            lat: null,
            lng: null,
            infected: 0,
            recovered: 0,
            dead: 0    
        };

        // Get current data
        var headers = e.properties.headers.split(';;');
        var currentDate = headers[headers.length - 1];

        // Bind data
        data.id = new Hashes.MD5().hex(`${e.properties.countryregion}${e.properties.provincestate}`);
        data.country = e.properties.countryregion;
        data.state = e.properties.provincestate;
        data.lat = e.properties.lat;
        data.lng = e.properties.long;
        data.infected = e.properties[currentDate];
        data.recovered = e.properties[`recoveries_${currentDate}`];
        data.dead = e.properties[`deaths_${currentDate}`];

        // Clean data
        data.country = !!data.country && data.country.length > 0 ? data.country : null;
        data.state = !!data.state && data.state.length > 0 ? data.state : null;
        data.lat = !!data.lat && data.lat.length > 0 ? Number(data.lat) : null;
        data.lng = !!data.lng && data.lng.length > 0 ? Number(data.lng) : null;
        data.infected = !!data.infected ? data.infected : 0;
        data.recovered = !!data.recovered ? data.recovered : 0;
        data.dead = !!data.dead ? data.dead : 0;

        output.push(data);
    });

    // Create rows for country totals
    _.chain(output)
        .filter((p) => {
            return !((!!p.country && p.country.includes('Diamond Princess')) || (!!p.state && p.state.includes('Diamond Princess')))
        })
        .groupBy('country')
        .filter((group) => {
            var c = 0;
            _.each(group, (p) => {
                c = !!p.country && !p.state ? c++ : c;
            });
            return c <= 0;
        })
        .each((group) => {
            output.push({
                id: new Hashes.MD5().hex(`${group[0].country}${null}`),
                country: group[0].country,
                state: null,
                lat: null,
                lng: null,
                infected: _.reduce(group, (m, p) => { return m + p.infected; }, 0),
                recovered: _.reduce(group, (m, p) => { return m + p.recovered; }, 0),
                dead: _.reduce(group, (m, p) => { return m + p.dead; }, 0)
            });
        });

    // Deal with special cases
    var diamondPrincessData = _.filter(output, (p) => { return (!!p.country && p.country.includes('Diamond Princess')) || (!!p.state && p.state.includes('Diamond Princess')) });
    output.push({
        id: new Hashes.MD5().hex(`${'Diamond Princess'}${null}`),
        country: 'Diamond Princess',
        state: null,
        lat: null,
        lng: null,
        infected: _.reduce(diamondPrincessData, (m, p) => { return m + p.infected; }, 0),
        recovered: _.reduce(diamondPrincessData, (m, p) => { return m + p.recovered; }, 0),
        dead: _.reduce(diamondPrincessData, (m, p) => { return m + p.dead; }, 0)
    });

    return output;
}

function plotData() {
    db.data.toArray((array) => {
        array.forEach(p => {
            plotDataPoint(p);
        });
    });
}

function plotDataPoint(data) {
    if (!!data.lat && !!data.lng) {
        L.circle([data.lat, data.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.1,
            stroke: false,
            radius: calcRadius(data)
        }).bindPopup(`<b>${data.country}${!!data.state ? ', ' + data.state : ''}</b><br>Infected: ${data.infected}<br>Recovered: ${data.recovered}<br>Dead: ${data.dead}`).addTo(map);
    };
}

function calcRadius(data) {
    var r = 100000 * (1 + Math.log(data.infected + data.recovered + data.dead)) * 0.5;
    return r;
}