/**
 * Search 插件 extends Inputs
 */
var template = require('../template');

import $ from 'jquery'

import mixin from '../tools/mixin.js';
import EventMixin from '../tools/event.js';
import Inputs from './inputs.js';


let TPL_SEARCH = '<div class="cdlist-search-container">' +
  '<input class="cdlist-search-input" id="<%= datas[0].selector.slice(1) %>"  value="<%= val %>" placeholder="<%= placeholder %>" />' +
  '<a href="javascript:void(0);" class="cdlist-search-action"><%= btnText %></a>' +
'</div>';

let _addonName = 'search'

let _option = {
  btnText: '搜索',
  val: '',
  placeholder: '',
  name: 'search',
  enableEnter: 1,
  allowEqual: 1,
  resetList: ['pagination', 'filter', 'sort']
}

let ID_PRE = 'cdlist-search-input-';

let _searchCounter = 0;

function _createSelectorData (option) {
  return {
    selector: ['#', ID_PRE, _getCounter()].join(''),
    regex: option.regex,
    name: option.name,
    historyKey: option.historyKey
  }
}

function _getCounter () {
  return _searchCounter++;
}

export default class Search extends Inputs {
  constructor (option) {
    // search 插件只有搜索选项
    option.datas = [];
    option.datas.push(_createSelectorData(Object.assign({}, _option, option)))

    super(Object.assign({}, _option, option));
  }


  getName () {
    return _addonName;
  }

  initView () {
    let html = template(TPL_SEARCH, this.option);

    this._getContainer().html(html);

    Inputs.prototype.initView.apply(this);

    this._initSearchEvents();
  }

  _initSearchEvents () {
    this._getContainer().delegate('.cdlist-search-action', 'click', (e) => {
      let $input = this._getContainer().find('.cdlist-search-input');

      this.setValue($input.prop('name'), $input.val());
    });
  }

  getAddonData () {
    let data = Inputs.prototype.getAddonData.apply(this);

    return data[this.option.name];
  }
}
