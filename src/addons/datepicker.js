/**
 * datepicker 插件，extends Inputs
 */
var template = require('../template');

import $ from 'jquery'

import mixin from '../tools/mixin.js';
import EventMixin from '../tools/event.js';
import Inputs from './inputs.js';

const TPL_LAYOUT = '<div class="cdlist-datepicker-container"></div>';

const TPL_DATE = '<% for (var i = 0; i < datas.length; i++) { %>' +
  '<div class="cdlist-datepicker-item <%= datas[i].className %>">' +
    '<% if (datas[i].label) { %>' +
      '<span class="cdlist-datepicker-label"><%= datas[i].label %></span>' +
    '<% } %>' +
    '<input readonly id="<%= datas[i].selector.slice(1) %>" />' +
  '</div>' +
'<% } %>';

const BASE_FLAT_CONFIG = {};

let _option = {
  resetList: ['pagination', 'filter', 'sort']
}

let _addonName = 'datepicker'
let ID_PRE = 'cdlist-datepicker-input-';

let _datepickerCounter = 0;

function _createSelector (datas) {
  datas.forEach((data) => {
    data.selector = ['#', ID_PRE, _getCounter()].join('');
  });
}

function _getCounter () {
  return _datepickerCounter++;
}

let Flatpickr;

export default class DatePicker extends Inputs {
  constructor (option) {
    if (window.Flatpickr == undefined) {
      throw new Error('require Flatpickr');
    } else {
      Flatpickr = window.Flatpickr;
    }

    _createSelector(option.datas);

    super(Object.assign({}, _option, option));
  }


  getName () {
    return _addonName;
  }

  _createDatePickerInput () {
    let $pickerContainer = this._getContainer().find('.cdlist-datepicker-container');

    let html = template(TPL_DATE, {
      datas: this.option.datas
    });

    $pickerContainer.html(html);
  }

  initView () {
    this._getContainer().html(TPL_LAYOUT);
    this._createDatePickerInput();

    Inputs.prototype.initView.apply(this);

    this._createDatePicker();
  }

  _createDatePicker () {
    let flatPickrArr = {};
    let self = this;

    this.option.datas.forEach((data) => {
      let input = $(data.selector).get(0);

      let config = Object.assign({
        locale: this.root.option.lang
      }, BASE_FLAT_CONFIG, data.flatPickrConfig);

      // 关闭时触发改变
      if (config.onClose) {
        let userCallback = config.onClose;

        config.onClose = function (selectedDates, dateStr, instance) {
          if (!dateStr) {
            return;
          }
          self.setValue(data.name, dateStr);

          userCallback.apply(this, Array.prototype.slice.apply(arguments));
        };
      } else {
        config.onClose = function (selectedDates, dateStr, instance) {
          if (!dateStr) {
            return;
          }
          self.setValue(data.name, dateStr);
        };
      }

      flatPickrArr[data.name] = new Flatpickr(input, config);
    });

    this.trigger('flatinited', [flatPickrArr]);
  }
}
