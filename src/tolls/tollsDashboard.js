import { visibility } from "../modules/util";
import { EventMap, EventNavigator, EventTrend } from "../modules/dashboard";

export function mainTolls(data) {
  console.log(data);
}

  /*
  function buildDashboard() {
    try {
    const chartParams = metaData;
    // add the system name to metadata
    try {
        chartParams.systemName = lang.companyToSystem[metaData.pipeName];
    } catch (err) {
        chartParams.systemName = metaData.pipeName;
    }

    lang.dynamicText("system-incidents-paragraph", chartParams);

    setTitle(lang, chartParams);
    const trends = tollsTimeSeries(field, filters);
    const volumeBtn = document.getElementById("tolls-volume-btn");
    // user selection to show volume or incident frequency
    $("#inline_content input[name='type']").click(() => {
        const btnValue = $("input:radio[name=type]:checked").val();
    });
  return buildDashboard();
}
*/

/*

Highcharts.chart('container', {

    title: {
        text: 'Tolls by Path'
    },

    yAxis: {
        title: {
            text: 'Tolls ($/mmBTu)'
        }
    },

    xAxis: {
            categories: ["2005-01-01 00:00:00", "2005-01-02 00:00:00", "2005-01-03 00:00:00", "2005-01-04 00:00:00", "2005-01-05 00:00:00", "2005-01-06 00:00:00", "2005-01-07 00:00:00", "2005-01-08 00:00:00"]
    },

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
    },

    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            }
        }
    },

    series: [{
        name: 'Path1',
        data: [500, 500, 500, 800, 800, 800, 800, 800]
    }, {
        name: 'Path2',
        data: [300, 300, 300, 300, 700, 700, 700, 700]
    }, {
        name: 'Path3',
        data: [450, 450, 450, 550, 550, 550, 700, 700]
    }, {
       
    }],

    responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    }

});


    

*/
