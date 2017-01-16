import $ from 'jquery';

import template from './template.js';

import Filter from './addons/filter.js';
import Pagination from './addons/pagination.js';
import Search from './addons/search.js';
import Sort from './addons/sort.js';
import Inputs from './addons/inputs.js';
import DatePicker from './addons/datepicker.js';

import EventMixin from './tools/event.js';
import HTML5History from './tools/history_h5.js';
import mixin from './tools/mixin.js';
import url from './tools/url';
import L10 from './l10/index.js';

import './style/default.less'

let tools;
let addons;
let TPL_CD_LAYOUT  = [
  '<div data-cd-container="plugin-top"></div>',
  '<div class="cdlist-list-container" data-cd-container="list"></div>',
  '<div data-cd-container="plugin-bottom"></div>'
];
let TPL_CD_EMPTY = '<div class="cdlist-list-empty"><%= emptyText %></div>';

const STAT_LOADING = 'STATE_LOADING';
const STAT_LOADED = 'STAT_LOADED';

const DEFAULT_HISTORY_CONF = {
  base: window.location.pathname
};

let _option = {
  disableHistory: false,
  lang: 'zh'
}

class CdList extends mixin(EventMixin) {
  constructor(option, el) {
    super();

    this.option = Object.assign({}, _option, option);
    this.$el = $(el).addClass('cdlist-root-container');
    this.lang = L10[this.option.lang] || L10['en'];

    this._bindHistory();
    this._initEvent();

    this.setAddons(option.addons);
  }

  getHistoryValue (key) {
    if (this.historyOpt) {
      return this.historyOpt[key];
    }
  }

  removeHistory (key, preventDisptach) {
    if (!this.historyOpt) {
      return;
    }

    // 防止立即执行
    this._pushAction(function () {
      delete this.historyOpt[key];
    });

    this._pushTimer && clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this._pushHistory(preventDisptach);
    }, 5);
  }

  /**
   *
   */
  setHistory (key, value, preventDisptach) {
    this.historyOpt = this.historyOpt || {};

    // 和以前的一样不需要改变
    if (this.historyOpt[key] == value) {
      return;
    }

    this._pushAction(function () {
      this.historyOpt[key] = value;
    });

    // addons will call many times
    // but only push history onec
    this._pushTimer && clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this._pushHistory(preventDisptach);
    }, 5);
  }

  _doAction () {
    this._actions.forEach((a) => {
      a.apply(this);
    });

    this._actions = [];
  }

  _pushHistory (preventDisptach) {
    var self = this;

    self._doAction();

    var historyOpt = self.historyOpt;
    var param = $.param(historyOpt);

    self.preventDisptach = preventDisptach;
    self.history.push('?' + param);
  }

  _pushAction (cb) {
    var self = this;

    self._actions = self._actions || [];
    self._actions.push(cb);
  }

  /**
   * bind history Event
   * every cdlist will listen history, and disptach change events
   * but addon can decide whether to response this event self
   */
  _bindHistory () {
    var self = this,
      state, historyOpt;

    var option = Object.assign({}, DEFAULT_HISTORY_CONF, self.option.historyOption);

    this.history = new HTML5History(option.base, {
      disableHistory: this.option.disableHistory
    });

    // get init history state
    var state = this.history.getState();
    var hash = decodeURIComponent(state.hash);
    hash && (this.historyOpt = tools.url.getParamMap(hash));

    this.history.listen((state) => {
      var historyOpt = this.historyOpt = tools.url.getParamMap(decodeURIComponent(state.hash));

      if (!self.preventDisptach) {
        self._disptachHistory(historyOpt);
      }

      self.preventDisptach = undefined;
    });
  }

  _disptachHistory (historyOpt) {
    this.trigger('hashchange', [historyOpt]);
  }

  _initEvent () {
    this.on('reflow', () => {
      this._getListTimer && clearTimeout(this._getListTimer);

      this._getListTimer = setTimeout(() => {
        this.getList();
      }, 50);
    });
  }

  /**
   * init cd list baseview & eveny addons
   */
  _initView () {
    this.$el.html(TPL_CD_LAYOUT);
    this.$topPluginContainer = this.$el.find('[data-cd-container=plugin-top]');
    this.$bottomPluginContainer = this.$el.find('[data-cd-container=plugin-bottom]');
    this.$listContainer = this.$el.find('[data-cd-container=list]');

    for (var key in this.addons) {
      this.addons[key].initView();
    }
  }

  getList () {
    var self = this;

    // if ajax is getting data , abort it
    if (self._isLoading()) {
      self.ajaxInstance.abort();
    }

    var urlData = {};

    for (var key in this.addons) {
      urlData[key] = this.addons[key].getAddonData();
    }

    var url = self.option.getUrl(urlData);

    // 通过 option AJAX 可以发送跨域请求
    if (url) {
      self.ajaxInstance = self.option.getAjaxData ? self.option.getAjaxData(url)
        : self._getAjaxData(url);

      self._startLoading();

      // 成功回调处理
      self.ajaxInstance.done(function (json) {
        var rowData = self.option.getRowsData(json);

        self.trigger('loadeddata', [json]);

        self._endLoading(json);
        self._firstGet = false;

        if (rowData && rowData.length) {
          self._render(rowData, json);
        } else {
          self._renderEmpty(urlData);
        }
      });
    }
  }

  setAddons (addonsList = []) {
    var self = this;

    self.addons = {};

    // 初始化各个 addons
    addonsList.forEach(function (addon) {
      if (self._validateAddon(addon)) {
        addon.setRoot(self);
        self.addons[addon.getName()] = addon
      } else {
        // console && console.warn('your addon ' + addon.getName() + ' is invaild');
      }
    });

    self._initView();

    return self;
  }

  _validateAddon (addon) {
    var f = true;

    ['getName', 'initView', 'setRoot'].forEach(function (item) {
      if (addon[item] === undefined) {
        f = false;
        return false;
      }
    });

    return f;
  }

  _renderEmpty (urlData) {
    this.$listContainer.html(this.option.empty ?
        this.option.empty(urlData) : template(TPL_CD_EMPTY, {
          emptyText: this.lang.NO_SEARCH_RESULT
        }));
  }

  _getAjaxData (url) {
    return $.ajax({
      url: url
    });
  }

  _isLoading () {
    return this.__load_state == STAT_LOADING;
  }

  _startLoading () {
    this.__load_state = STAT_LOADING;
    this.$el.addClass('loading');
    this.trigger('startloading');
  }

  _endLoading (json) {
    this.__load_state = STAT_LOADED;
    this.$el.removeClass('loading');
    this.trigger('endloading', [json]);
  }

  _render (rowData, json) {
    var self = this,
      html;

    var tbodyStr = '';

    rowData.forEach(function (data) {
      var str = self.option.rows(data);

      tbodyStr += str;
    });

    if (self.option.isTable) {
      html = ['<table class=\"' + (self.option.tableClass || '') + '\">',
        '<thead>',
          self.option.headerRow(rowData, json),
        '</thead>',
        '<tbody>',
          tbodyStr,
        '</tbody>',
      '</table>'].join("");
    } else {
      html = ['<ul class=\"' + (self.option.ulClass || '') + '\">',
          tbodyStr,
      '</ul>'].join("");
    }

    self.$listContainer.html(html);
  }
}

CdList.addons = addons = {
  Filter,
  Pagination,
  Search,
  Sort,
  Inputs,
  DatePicker
};

CdList.tools = tools = {
  url: url
}

export default CdList;
