import $ from 'jquery';
var template = require('../template');

var TPL_FILTER = '<div class="cdlist-filter-container">' +
  '<ul class="cdlist-filter-list">' +
    '<% for (var i = 0; i < filters.length; i++) { %>' +
      '<li class="cdlist-filter-list-item">' +
        '<span class="cdlist-filter-select-name"><%= filters[i].label %></span>' +
        '<select name=\'<%= filters[i].name %>\'>' +
          '<% for (var j = 0; j < filters[i].datas.length; j++) { %>' +
            '<option <% if (j == filters[i].activeIndex) { %>selected="selected"<% } %>  data-idx="<%= j %>" value=\'<%= filters[i].datas[j].value %>\'><%= filters[i].datas[j].name %></option>' +
          '<% } %>' +
        '</select>' +
      '</li>' +
    '<% } %>' +
  '</ul>' +
'</div>';

var TPL_FILTER_LINE = '<div class="cdlist-filter-container cdlist-filter-container-line">' +
    '<ul class="cdlist-filter-list">' +
      '<% for (var i = 0; i < filters.length; i++) { %>' +
        '<li <% if (filters[i].className) { %>class="cdlist-filter-list-item <%= filters[i].className %>"' +
          '<% } else { %> class="cdlist-filter-list-item" <% } %> >' +
          '<% if (filters[i].label) { %>' +
            '<div class="cdlist-filter-select-name"><%= filters[i].label %></div>' +
          '<% } %>' +
          '<ul class="cdlist-filter-raw-list">' +
            '<% for (var j = 0; j < filters[i].datas.length; j++) { %>' +
              '<li data-name="<%= filters[i].name %>" class="cdlist-filter-raw-item <% if (j == filters[i].activeIndex) { %>cdlist-filter-raw-item-active<% } %>" data-value="<%= filters[i].datas[j].value %>">' +
                '<a href="javascript:void(0)"><%= filters[i].datas[j].name %></a>' +
              '</li>' +
            '<% } %>' +
          '</ul>' +
        '</li>' +
      '<% } %>' +
    '</ul>' +
  '</div>';


let _addonName = 'filter';
let _option = {
  resetList: ['pagination']
};

export default class Filter {

  constructor (option) {
    this.option = Object.assign({}, _option, option);
  }

  getName () {
    return _addonName;
  }

  /**
   * 获取存放 filter 的 container
   */
  _getContainer () {
    return this.option.container ? $(this.option.container) : this.root.$topPluginContainer;
  }

  initView () {
    var self = this;
    var $container = self._getContainer();

    $container.append($(self._getHTML()));

    this._initEvent();
  }

  /**
   * 改变 filter 时设置 hash
   */
  _setHash (key, value) {
    var self = this;

    // 找到 filter
    var filter = self.option.filters.filter(function (item) {
      return key == item.name
    })[0];

    if (filter) {
      self.root.setHistory(filter.historyKey || filter.name, value);
    }
  }

  _triggerResetEvent (preventSet) {
    this.option.resetList.forEach((addonName) => {
      this.root.trigger(addonName + '.reset', [preventSet])
    });
  }

  _initEvent () {
    var self = this;

    // 监听使自己 reset 的事件
    self.root.on('filter.reset', (e, preventDisptach) => {
      self.reset(preventDisptach);
    });

    // 发生改变立即进行重新请求
    if (self.option.line) {
      self._getContainer().delegate('.cdlist-filter-raw-item', 'click', function (e, preventSet) {
        $(this).addClass('cdlist-filter-raw-item-active')
          .siblings().removeClass('cdlist-filter-raw-item-active');

        self._triggerResetEvent(preventSet);
        self.root.trigger('reflow');

        // 设置 filter 的 hash
        if (self.option.historyEnable && !preventSet) {
          var key = $(this).attr('data-name');
          var value = $(this).attr('data-value');

          self._setHash(key, value, true);
        }

        self.option.onChange && self.option.onChange();
      });
    } else {
      self._getContainer().delegate('select', 'change', function (e, preventSet) {
        self._triggerResetEvent(preventSet);
        self.root.trigger('reflow');

        // 设置 filter 的 hash
        if (self.option.historyEnable && !preventSet) {
          var key = $(this).prop('name');
          var value = $(this).val();

          self._setHash(key, value, true);
        }

        self.option.onChange && self.option.onChange();
      });
    }
  }

  /**
   * 处理默认的 filter 数据
   * 找到每个 filter 的初始化选中的内容
   */
  _dealFilterData (filters) {
    var self = this,
      option = self.option;

    filters.forEach(function (item) {
      // 最先控制本身的 activeIndex
      if (item.activeIndex !== undefined) {
        return;
      }

      // 开启 history 模式
      // 需要找到 hash 对应的选项
      if (self.option.historyEnable) {
        var historyKey = item.historyKey || item.name;
        var historyValue = self.root.getHistoryValue(historyKey);

        if (historyValue) {
          item.datas.forEach(function (data, idx) {
            if (historyValue == data.value) {
              item.activeIndex = idx;
            }
          });
        }
      }

      // 总有 index
      item.activeIndex = item.activeIndex || 0;
    });
  }

  /**
   * 渲染 filter 模板
   */
  _getHTML () {
    var filters = this.option.filters;
    var self = this;

    self._dealFilterData(filters);

    if (self.option.line) {
      return template(TPL_FILTER_LINE, {filters: filters});
    } else {
      return template(TPL_FILTER, {filters: filters});
    }
  }

  /**
   * 设置 filter 一项的选中状态
   */
  setActive (name, value, preventHistory) {
    var filter = this._getFilterByName(name);
    var self = this;

    if (!filter) {
      return;
    }

    if (self.option.line) {
      var $li = self._getContainer().find('.cdlist-filter-raw-item[data-name="' + filter.name + '"][data-value="' + value + '"]');

      // 已经选中了就不触发了
      if ($li.hasClass('cdlist-filter-raw-item-active')) {
        return;
      }

      if ($li.length) {
        $li.trigger('click', [preventHistory]);
      }
    } else {
      var $option = self._getContainer().find('select[name="' + filter.name + '"] option[value="' + value + '"]');

      if ($option.prop('selected')) {
        return;
      }

      if ($option.length) {
        self._getContainer().find('select[name="' + filter.name + '"]')
          .prop('selectedIndex', $option.data('idx'))
          .trigger('change', [preventHistory]);
      }
    }
  }

  /**
   * 通过 name 获取 filter 项目
   */
  _getFilterByName (name) {
    var filter = this.option.filters.filter(function (item) {
      return name == item.name
    });

    return filter[0];
  }

  /**
   * 设置 addon 的 root 对象
   */
  setRoot (root) {
    var self = this;

    self.root = root;

    // 如果可以改变 hash
    if (self.option.historyEnable) {
      self.root.on('hashchange', function (e, hashData) {
        var currentData = self.getAddonData(true);

        for (var key in currentData) {
          // 找到 filter
          var filter = self._getFilterByName(key);

          // 没有 filter 就继续
          if (!filter) {
            continue;
          }

          // 找到 history key
          var historyKey = filter.historyKey || filter.name;

          // 判定是否相等
          // 如果不相等需要改变 当前显示，并派发请求
          // 如果没有 hashValue 则为 filter 默认选中状态的 value
          var hashValue = hashData[historyKey] || filter.datas[filter.activeIndex].value;

          if (hashValue != currentData[key]) {
            if (self.option.line) {
              var value = hashData[historyKey] || filter.datas[filter.activeIndex].value;

              var $li = self._getContainer().find('.cdlist-filter-raw-item[data-name="' + key + '"][data-value="' + value + '"]');

              if ($li.length) {
                $li.trigger('click', [true]);
              }
            } else {
              var value = hashData[historyKey] || filter.datas[filter.activeIndex].value;

              var $option = self._getContainer().find('select[name="' + key + '"] option[value="' + value + '"]');

              if ($option.length) {
                self._getContainer().find('select[name="' + key + '"]').prop('selectedIndex', $option.data('idx'))
                  .trigger('change', [true]);
              }
            }
          }
        }
      });
    }
  }

  /**
   * 重置 filter 所有的 select
   */
  reset (preventDisptach) {
    this.option.filters.forEach((filter) => {
      this.setActive(filter.name, filter.datas[filter.resetIndex || 0].value, preventDisptach);
    });
  }

  /**
   * 获取 addon 提供的 url 数据
   */
  getAddonData () {
    var data = {};
    var self = this;
    var filters = self.option.filters;

    if (self.option.line) {
      this._getContainer().find('.cdlist-filter-raw-item-active').each(function () {
        data[$(this).attr('data-name')] = $(this).attr('data-value');
      });
    } else {
      this._getContainer().find('select').each(function () {
        data[$(this).prop('name')] = $(this).val();
      });
    }

    return data;
  }
}
