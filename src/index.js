var map;

$().ready(() => {
    // Setup Map
    map = L.map('map').setView([25.085598897064777, 21.621093750000004], 3);
    map.custom = {
        controls: {
            infoControl: null
        },
        layers: {
            countriesGeoJSON: null
        },
        layerGroups: {
            countriesGeoJSON: null,
            csseVirusData: null
        }
    };

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        minZoom: 3
    }).addTo(map);

    /*L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        minZoom: 3
    }).addTo(map);*/

    // Get CountryGeoJSON & WHO COVID-2019 Data
    getCountryGeoJSON().then((geoJson) => {
        plotCountryGeoJSON(geoJson);
    }).then(() => {
        // Get CSSE COVID-2019 Data
        getCSSEVirusData().then((json) => {
            plotCSSEVirusData(json);
        }).then(() => {
            // Add Layers
            map.custom.layerGroups.countriesGeoJSON.setZIndex(1);
            map.custom.layerGroups.csseVirusData.setZIndex(2);
            map.addLayer(map.custom.layerGroups.countriesGeoJSON);
            map.addLayer(map.custom.layerGroups.csseVirusData);

            // Add WHO COVID-2019 Control
            initInfoControl();

            // Add Layer Control
            L.control.layers({}, {
                'WHO COVID-2019 Data': map.custom.layerGroups.countriesGeoJSON,
                'CSSE COVID-2019 Data': map.custom.layerGroups.csseVirusData
            }).addTo(map);

            // Add Scale Control
            L.control.scale().addTo(map);

            // Clear country selection on click.
            $(document).on('mousedown', (e) => {
                map.custom.layers.countriesGeoJSON.resetStyle();
                map.custom.controls.infoControl.update();
            });
        });
    });
});

function initInfoControl() {
    map.custom.controls.infoControl = L.control({position: 'bottomright'});
	map.custom.controls.infoControl.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'control-info');
		this.update();
		return this._div;
	};
	map.custom.controls.infoControl.update = function (props) {
        if (!!props) {
            this._div.innerHTML = 
                `<div class="control-info-block">`+
                    `<span style="font-size: 22px;"><b>WHO COVID-2019 Situation Report Data</b></span><br>`+
                    `<span style="font-size: 12px;">Data provided by the <a href="https://www.who.int/emergencies/diseases/novel-coronavirus-2019/situation-reports/" target="_blank">WHO</a> and <a href="https://github.com/CSSEGISandData/COVID-19/tree/master/who_covid_19_situation_reports" target="_blank">Johns Hopkins University</a></span><br>`+
                `</div>`+
                `<div class="control-info-block">`+
                    `<span style="font-size: 18px;"><b>${props.name}</b>: ${props.cases} confirmed case${props.cases == 1 ? '' : 's' }${!!props.date ? ` as of ${props.date}` : ''}<span>`+
                `</div>`;
            $('.control-info').show();
        }
        else {
            $('.control-info').hide();
        }
	};
    map.custom.controls.infoControl.addTo(map);
    map.custom.controls.infoControl.update();
}

function getCountryGeoJSON() {
    return $.ajax({
        url: 'https://raw.githubusercontent.com/Mason32NZ/SandfieldTrainingLeaflet/master/data/ne_countries_simplified.json'
    })
    .then((json) => {
        var geoJson = JSON.parse(json);
        return getWHOVirusData().then((data) => {
            geoJson.features.forEach(p => {
                var a = _.filter(data, (q) => {
                    return p.properties.name.includes(q.country) || q.country.includes(p.properties.name); // Fuzzy join due to poor data.
                });
                var m = a.length > 0 ? a[0] : null;
                p.properties.cases = !!m ? m.cases : 0;
                p.properties.date = !!m ? m.date : null;
            });
            return geoJson;
        });
    });
}

function getWHOVirusData() {
    return $.ajax({
        url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/who_covid_19_situation_reports/who_covid_19_sit_rep_time_series/who_covid_19_sit_rep_time_series.csv'
    }).then((csv) => {
        var results = Papa.parse(csv, {
            header: true
        });

        var json = _.chain(results.data)
            .filter((p) => {
                return !!p['Country/Region'] && !(['Globally','Mainland China','Outside of China','Other'].includes(p['Country/Region']))
            })
            .groupBy((p) => {
                return p['Country/Region']
            })
            .map((g) => {
                var d = Object.keys(g[0])[Object.keys(g[0]).length-1];
                return {
                    country: g[0]['Country/Region'],
                    cases: _.reduce(g, (m, p) => { return m + Number(p[d]); }, 0),
                    date: d
                }
            })
            .value();
        return json;
    });
}

// Confirmed, Deaths, Recovered
function getCSSEVirusDataType(type) {
    return $.ajax({
        url: `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-${type}.csv`
    }).then((csv) => {
        var results = Papa.parse(csv, {
            header: true
        });

        var json = _.chain(results.data)
            .map((p) => {
                var d = Object.keys(p)[Object.keys(p).length-1];
                var obj = {
                    country: !!p['Country/Region'] ? p['Country/Region'] : `${p['Province/State']}1`, // Some join wizardry for the groupBy in getCSSEVirusData().
                    state: !!p['Province/State'] ? p['Province/State'] : `${p['Country/Region']}2`, // This gets cleaned up later.
                    date: d,
                    lat: Number(p['Lat']),
                    lng: Number(p['Long'])
                };
                obj[type.toLowerCase()] = Number(p[d]);
                return obj;
            })
            .value();
        return json;
    });
}

function getCSSEVirusData() {
    return getCSSEVirusDataType('Confirmed').then((confirmedJson) => {
        return getCSSEVirusDataType('Deaths').then((deathsJson) => {
            return getCSSEVirusDataType('Recovered').then((recoveredJson) => {
                var combinedArray = confirmedJson.concat(deathsJson.concat(recoveredJson));
                var json = _.chain(combinedArray)
                    .groupBy((p) => {
                        return p.country && p.state;
                    })
                    .map((g) => {
                        var obj = Object.assign({}, ...g)
                        obj.country = obj.country == `${obj.state}1` ? null : obj.country;
                        obj.state = obj.state == `${obj.country}2` ? null : obj.state;
                        return obj;
                    }).value();
                return json;
            });
        });
    });
}

function plotCountryGeoJSON(geoJson) {
    map.custom.layers.countriesGeoJSON = L.geoJSON(geoJson, {
        style: (feature) => {
            var c = calcColour(feature.properties.cases);
            return {
                weight: 1,
                color: c,
                opacity: 0.6,
                fillColor: c,
                fillOpacity: 0.4
            };
        },
        onEachFeature: (feature, layer) => {
            layer.on({
                click: highlightFeature
            });
        }
    });
    map.custom.layerGroups.countriesGeoJSON = L.layerGroup([map.custom.layers.countriesGeoJSON]);
}

function plotCSSEVirusData(data) {
    var circles = [];
    data.forEach(p => {
        if (!!p.lat && !!p.lng) {
            var circle = L.circle([p.lat, p.lng], {
                radius: calcRadius(p),
                stroke: false,
                weight: 1,
                color: "#ff0000",
                opacity: 0.4,
                fillColor: '#c90000',
                fillOpacity: 0.2
            }).bindPopup(
                `<span><b>${p.country}${!!p.state ? `, ${p.state}` : ''}</b></span><br><br>`+
                `<span>Infected: ${p.confirmed}</span><br>`+
                `<span>Recovered: ${p.recovered}</span><br>`+
                `<span>Dead: ${p.deaths}</span><br><br>`+
                `<span>Data provided by <a href="https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data" target="_blank">Johns Hopkins University</a></span><br>`+
                `<span>Last Updated: ${p.date}</span>`
            );
            circles.push(circle);
        };
    });
    map.custom.layerGroups.csseVirusData = L.layerGroup(circles);
}

function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 2,
        color: '#fff',
        opacity: 0.8,
        fillOpacity: 0.6
    });
    map.custom.controls.infoControl.update(layer.feature.properties);
}

function calcRadius(properties) {
    var r = 100000 * (1 + Math.log(properties.confirmed + properties.deaths)) * 0.5;
    return r;
}

function calcColour(num) {
    var p = calcWeightedPercentage(num, [1,10,50,100,500,1000,5000,20000]);
    var s = chroma.scale(['#8a8a8a','#9e0000']);
    return s(p).hex();
}

function calcWeightedPercentage(num, scale) {
    var c = 1 / (scale.length + 1);
    var i, n, l, b;
    for (i = 0; i < scale.length; i++) {
        n = scale[i];
        l = i == 0 ? 0 : scale[i - 1];
        b = num - l;
        if (num < n) {
            break;
        }
    }
    return num == 0 ? 0 : (i * c) + ((b > (n - l) ? (n - l) : b) / (n - l) / (scale.length + 1));
}