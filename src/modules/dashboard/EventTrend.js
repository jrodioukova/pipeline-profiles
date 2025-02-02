/**
 * @file Contains class definition for a simple highcharts bar chart meant to show the frequency of events over time.
 *
 * When paired with an EventNavigator, the chart can update its series, and display custom text below the chart on either
 * a bar series click, or EventNavigator pill click.
 *
 * The stacked bar chart "smartly" arranges its axis by automatically filling in gaps between non consecutive years, and
 * adding empty bars between the last year of data, and the current client year.
 *
 * Functionality for disclaimers, language switching, and automated axis titles is built in.
 */

import { visibility, rangeInclusive } from "../util";

const ONETOMANY = {
  Substance: false,
  Status: false,
  Province: false,
  what: true,
  why: true,
  category: true,
};

/**
 * Class responsible for configuring a highcharts stacked bar displaying event trends over time (yearly).
 * Contains fieldChange and updateRadius methods similiar to EventMap methods and plotHeight parameter for
 * EventNavigator polymorphism pattern.
 */
export class EventTrend {
  /**
   *
   * @param {Object} constr - EventTrend constructor
   * @param {string} constr.eventType - Short name for the dataset, eg: incidents (lowercase).
   * @param {string} constr.field - The initial data column to have selected by default.
   * @param {string} constr.filters - Initial data "values" to show eg: {type: "frequency"} or {type: "volume" }
   * @param {(Object[]|Object)} constr.data - Dataset to be shaped into highcharts series.
   * @param {string} constr.divId - HTML div id where highchart will be loaded.
   * @param {Object} constr.lang - Object containing language switching functionality for dashboard components.
   * @param {string} [constr.seriesed=false] - Whether the "data" has already been shaped into a series structure of {pill name: {data:[], year:[]} }
   * @param {string} [constr.definitionsOn="bar"] - Defines what click action will display text below the chart. When "bar", the user must click on a bar series to view the definition. When "pill" the user must click different pills to change the text.
   * @param {Object} [constr.seriesInfo={}] - When "seriesed" this must contain info about the series names, colors, etc. {pillName: {id: {c: color, n: name}}}
   * @param {Object} [constr.definitions={}] - Object containing {id: text} pairs for language switching the definitions (definitionsOn="bar") or column descriptions (definitionsOn="pill").
   */
  constructor({
    eventType,
    field,
    filters,
    data,
    divId,
    lang,
    seriesed = false,
    definitionsOn = "bar", // show text on bar click, or pill click
    seriesInfo = {},
    definitions = {},
  }) {
    this.eventType = eventType;
    this.field = field;
    this.filters = filters;
    this.data = data;
    this.divId = divId;
    this.lang = lang;
    this.seriesed = seriesed;
    this.definitionsOn = definitionsOn;
    this.seriesInfo = seriesInfo;
    this.colors = lang.EVENTCOLORS;
    this.definitions = definitions;
    this.ONETOMANY = ONETOMANY;
    this.definitionDiv = `trend-definitions-${eventType}`;
    this.hasDefinition = this.displayDefinitions();
    this.createChart();
  }

  static dummyYears(yearList, dataFormat = "object") {
    let uniqueYears = yearList;
    const currentYear = new Date().getFullYear();
    const maxYear = uniqueYears.slice(-1)[0];
    let lastYears = [];
    if (currentYear > maxYear) {
      lastYears = rangeInclusive(maxYear + 1, currentYear);
    }

    uniqueYears = uniqueYears.concat(lastYears);
    const dummySeries = { name: "dummy", showInLegend: false }; // makes sure that the x axis is in order
    const dummyData = [];

    const addMethod = () => {
      if (dataFormat === "object") {
        return (year) => ({ name: year.toString(), y: undefined });
      }
      return (year) => [year, undefined];
    };

    const adder = addMethod();
    uniqueYears.forEach((y, index) => {
      if (
        y + 1 !== uniqueYears[index + 1] &&
        index !== uniqueYears.length - 1
      ) {
        const firstYear = y;
        const lastYear = uniqueYears[index + 1] - 1;
        for (let i = firstYear; i <= lastYear; i += 1) {
          dummyData.push(adder(i));
        }
      } else {
        dummyData.push(adder(y));
      }
    });
    dummySeries.data = dummyData;
    return dummySeries;
  }

  generateSeries(data, field) {
    if (!this.seriesed) {
      return this.processEventsData(data, field);
    }
    const xvalues = data[field].year;
    let currentInfo = {};
    if (Object.prototype.hasOwnProperty.call(this.seriesInfo, this.field)) {
      currentInfo = this.seriesInfo[this.field];
    }

    const preparedSeries = data[field].data.map((s) => {
      const newSeries = {};
      newSeries.data = s.data.map((row, i) => [xvalues[i], row]);
      if (Object.prototype.hasOwnProperty.call(currentInfo, s.id)) {
        newSeries.name = currentInfo[s.id].n;
        newSeries.color = currentInfo[s.id].c;
      } else {
        newSeries.name = s.id;
      }
      newSeries.id = s.id;
      return newSeries;
    });

    const dummySeries = EventTrend.dummyYears(data[field].year, "list");
    preparedSeries.push(dummySeries);
    return preparedSeries;
  }

  applyColor(rowValue, field) {
    try {
      return this.colors[field][rowValue].c;
    } catch (err) {
      return undefined;
    }
  }

  processEventsData(data, field) {
    const yField = (multipleValues) => {
      if (!multipleValues) {
        return function (events) {
          const series = {};
          const uniqueYears = new Set();
          events.forEach((row) => {
            uniqueYears.add(row.Year);
            if (Object.prototype.hasOwnProperty.call(series, row[field])) {
              if (
                Object.prototype.hasOwnProperty.call(
                  series[row[field]],
                  row.Year
                )
              ) {
                series[row[field]][row.Year] += 1;
              } else {
                series[row[field]][row.Year] = 1;
              }
            } else {
              series[row[field]] = { [row.Year]: 1 };
            }
          });
          return [series, Array.from(uniqueYears)];
        };
      }
      return function (events) {
        const series = {};
        const uniqueYears = new Set();
        events.forEach((row) => {
          let itemList;
          uniqueYears.add(row.Year);
          if (row[field].length > 1) {
            itemList = row[field];
            itemList = itemList.map((value) => value.trim());
          } else {
            itemList = [row[field]];
          }
          itemList.forEach((yVal) => {
            if (Object.prototype.hasOwnProperty.call(series, yVal)) {
              if (
                Object.prototype.hasOwnProperty.call(series[yVal], row.Year)
              ) {
                series[yVal][row.Year] += 1;
              } else {
                series[yVal][row.Year] = 1;
              }
            } else {
              series[yVal] = { [row.Year]: 1 };
            }
          });
        });
        return [series, Array.from(uniqueYears)];
      };
    };
    const seriesCounter = yField(this.ONETOMANY[field]);
    const [series, uniqueYears] = seriesCounter(data);

    const dummySeries = EventTrend.dummyYears(uniqueYears, "object");
    const seriesList = [];
    seriesList.push(dummySeries);
    Object.keys(series).forEach((seriesId) => {
      const seriesData = series[seriesId];
      const hcData = [];
      Object.keys(seriesData).forEach((xVal) => {
        const yVal = seriesData[xVal];
        hcData.push({ name: xVal, y: yVal });
      });
      seriesList.push({
        name: this.colors[field][seriesId].n,
        id: seriesId,
        data: hcData,
        color: this.applyColor(seriesId, field),
      });
    });
    return seriesList;
  }

  yAxisTitle() {
    if (this.filters.type === "frequency") {
      return `${this.lang.trendYTitle}`;
    }
    return "";
  }

  pillNameSubstitution() {
    if (
      Object.prototype.hasOwnProperty.call(
        this.lang.pillTitles.titles,
        this.field
      )
    ) {
      return this.lang.pillTitles.titles[this.field];
    }
    return this.field;
  }

  oneToManyDisclaimer() {
    const destoryLabel = (chart) => {
      if (chart.customLabel) {
        chart.customLabel.destroy();
      }
    };
    if (this.ONETOMANY[this.field]) {
      destoryLabel(this.chart);
      this.chart.customLabel = undefined;

      const text = `<p class="alert alert-warning" style="padding:4px">${this.lang.countDisclaimer(
        this.eventType,
        this.pillNameSubstitution()
      )}</p>`;
      const label = this.chart.renderer
        .label(text, null, null, null, null, null, true)
        .attr({
          padding: 0,
        })
        .css({
          "max-width": "700px",
          margin: 0,
        })
        .add(this.chart.rGroup);

      label.align(
        Highcharts.extend(label.getBBox(), {
          align: "left",
          x: 50, // offset
          verticalAlign: "top",
          y: -27, // offset
        }),
        null,
        "spacingBox"
      );
      this.chart.customLabel = label;
    } else {
      destoryLabel(this.chart);
      this.chart.customLabel = undefined;
    }
  }

  displayDefinitions() {
    // const definitionDiv = `trend-definitions-${this.eventType}`; // make sure .hbs temaplate has correct id for event type
    const definitionsPopUp = document.getElementById(this.definitionDiv);
    if (Object.prototype.hasOwnProperty.call(this.definitions, this.field)) {
      visibility([this.definitionDiv], "show");
      // when on incidents, show text on bar click. When on oandm, show text on pill click
      if (this.definitionsOn === "bar") {
        // user click on highcharts bar for definition to appear
        definitionsPopUp.innerHTML = this.lang.barClick(
          this.pillNameSubstitution()
        );
      } else if (this.definitionsOn === "pill") {
        // user clicks on pill to view info about that pill in definitions box
        definitionsPopUp.innerHTML = this.definitions[this.field];
      }
      return true;
    }
    visibility([this.definitionDiv], "hide");
    return false;
  }

  createChart() {
    const currentTrend = this;
    const chart = new Highcharts.chart(this.divId, {
      chart: {
        type: "column",
        animation: false,
        spacingTop: 25,
      },

      xAxis: {
        categories: true,
      },

      legend: {
        title: {
          text: currentTrend.lang.legendClick,
        },
        margin: 0,
        maxHeight: 120,
      },

      yAxis: {
        title: {
          text: currentTrend.yAxisTitle(),
        },
        stackLabels: {
          enabled: true,
        },
      },

      plotOptions: {
        series: {
          animation: false,
          events: {
            click() {
              if (
                currentTrend.definitionsOn === "bar" &&
                currentTrend.hasDefintion
              ) {
                const definitionsPopUp = document.getElementById(
                  currentTrend.definitionDiv
                );
                const keyColor =
                  currentTrend.colors[currentTrend.field][this.options.id].c;

                const key = `<strong style="color:${keyColor}">${this.name}:</strong>&nbsp`;
                definitionsPopUp.innerHTML =
                  key +
                  currentTrend.definitions[currentTrend.field][this.options.id];
              }
            },
          },
        },
      },
      series: this.generateSeries(this.data, this.field),
    });
    this.chart = chart;
    this.plotHeight = chart.chartHeight;
  }

  fieldChange(newField) {
    if (newField !== this.field) {
      this.field = newField;
      const newSeries = this.generateSeries(this.data, this.field);
      while (this.chart.series.length) {
        this.chart.series[0].remove();
      }
      newSeries.forEach((series) => {
        this.chart.addSeries(series, false);
      });
      this.oneToManyDisclaimer();
      this.hasDefintion = this.displayDefinitions();
      this.chart.redraw();
    }
  }

  updateRadius() {
    const newSeries = this.generateSeries(this.data, this.field);
    const currentTrend = this;
    this.chart.update({
      series: newSeries,
      yAxis: {
        title: {
          text: currentTrend.yAxisTitle(),
        },
      },
    });
  }
}
