import template from '../template';
import $ from 'jquery';

var TPL_SORT = '<div class="cdlist-sort-container">' +
  '<ul class="cdlist-sort-list">' +
    '<% for (var i = 0; i < datas.length; i++) { %>' +
      '<li class="cdlist-sort-item <% if (activeIndex == i) { %>cdlist-sort-item-active<% } %> ' +
        '<% if (activeIndex == i && datas[activeIndex].types) { %>' +
          'cdlist-sort-type-<%=datas[activeIndex].types[datas[activeIndex].activeIndex]%><% } %>"' +
        '<% if (activeIndex == i && datas[activeIndex].types) { %>' +
          'data-sort-type="<%=datas[activeIndex].types[datas[activeIndex].activeIndex]%>"<% } %>' +
        'data-sort-key="<%= datas[i].key %>">' +
        '<span><%= datas[i].name %></span>' +
      '</li>' +
    '<% } %>' +
  '</ul>' +
'</div>';

/**
 * sort addons provides a way to sort the table's results
 * you can define UI by yourself, or use built in dom structure
 *
 * @param {object}   option sort      addon option
 * @param {string}   option.container the container of addon
 * @param {[object]} option.datas     the datas of sort, it must be with the right format
 * eg. [{
 *   key: 'default',                  // the key of a item
 *   name: 'defaul'                   // the display name of a item
 },{
 *   key: 'time',
 *   name: 'time sorting',
 *   types: [                          // type is meant to provide different way of sorting
 *     cdlist.addons.Rank.Const.ASC,  // from low to high
 *     cdlist.addons.Rank.Const.DESC // from high to low
 *   ]
 * }]
 */
let _addonName = 'sort';

let _option = {
  historyKey: 'sort',
  historyTypeKey: 'sort_type',
  resetList: ['pagination']
};

class Sort {
  constructor (option) {
    this.option = Object.assign({}, _option, option);
  }

  getName () {
    return _addonName;
  }

  _getContainer () {
    return this.option.container ? $(this.option.container) : this.root.$topPluginContainer;
  }

  _triggerResetEvent (preventHistory) {
    this.option.resetList.forEach((addonName) => {
      this.root.trigger(addonName + '.reset', [preventHistory])
    });
  }

  initView () {
    var self = this;
    var $container = self._getContainer();
    $container.append($(self._getHTML()));

    this.$activeItems = $container.find('.cdlist-sort-item-active');

    this._initEvent();
  }

  _initEvent () {
    var self = this;

    self._getContainer().delegate('.cdlist-sort-item', 'click', function () {
      self._dealItem($(this));
    });

    self.root.on('sort.reset', function (e, preventDisptach) {
      self.reset(preventDisptach);
    });
  }

  activeSort (key, type, preventHistory) {
    var $item = this._getContainer().find('.cdlist-sort-item[data-sort-key=' + key + ']');
    var filterData = this._findDataItem(key);

    if (!$item.length || !filterData) {
      return;
    }

    // 如果当前改变的 sort item 跟之前的不一致
    // 则重置现有的 item
    if (this.$activeItems && (this.$activeItems.get(0) != $item.get(0))) {
      this._resetItem(this.$activeItems);
      this.$activeItems = $item.addClass('cdlist-sort-item-active');

      if (!preventHistory && this.option.historyEnable) {
        this.root.setHistory(this.option.historyKey, key);
      }
    }


    // type 存在且在 filterData 中有
    if (type && filterData.types && filterData.types.indexOf(type) > -1) {
      // 移除当前的type
      var currentType = $item.data('sort-type');
      currentType && $item.removeClass('cdlist-sort-type-' + currentType);

      // 不相等才进行设置
      if (currentType != type) {
        // 加入现在的 type
        $item.addClass('cdlist-sort-type-' + type).data('sort-type', type);

        if (!preventHistory && this.option.historyEnable) {
          if (type && filterData.types && filterData.types.indexOf(type) > -1) {
            this.root.setHistory(this.option.historyTypeKey, type);
          } else {
            this.root.removeHistory(this.option.historyTypeKey);
          }
        }
      }
    } else {
      if (!preventHistory && this.option.historyEnable) {
        this.root.removeHistory(this.option.historyTypeKey);
      }
    }

    this.option.onChange && this.option.onChange();

    return this._triggerChange(preventHistory);
  }

  /**
   * deal click event for a sorting item
   */
  _dealItem ($item) {
    var self = this,
      key = $item.data('sort-key'),
      nextIndex, nextType;

    var dataItem = self._findDataItem(key);

    // 找到要active的type值
    if (dataItem.types) {
      var currentType = $item.data('sort-type'),
        index = dataItem.types.indexOf(currentType);

      // 获得要变成的 type
      if (index == -1) {
        nextIndex = 0;
      } else {
        nextIndex = index + 1 == dataItem.types.length ? 0 : index + 1;
      }
      nextType = dataItem.types[nextIndex];
    }

    this.activeSort(key, nextType);
  }

  /**
   * reset a sort dom, when current sort dom is not equal to the last
   */
  _resetItem ($lastDom) {
    $lastDom.removeClass('cdlist-sort-item-active');
    $lastDom.removeClass('cdlist-sort-type-' + $lastDom.data('sort-type'));
    $lastDom.data('sort-type', null);
  }

  /**
   * trigger sort change event
   */
  _triggerChange (preventHistory) {
    this._triggerResetEvent(preventHistory);
    this.root.trigger('reflow');
  }

  /**
   * find user defined data item
   */
  _findDataItem (key) {
    var filterTypes = this.option.datas.filter(function (item) {
      return item.key == key;
    });

    return filterTypes[0];
  }

  _getHTML () {
    this._dealSortData();

    return template(TPL_SORT, {
      datas: this.option.datas,
      activeIndex: this.option.activeIndex
    });
  }

  _dealSortData () {
    var option = this.option;

    if (option.activeIndex !== undefined) {
      option.activeIndex = option.activeIndex || 0;
      var itemData = option.datas[option.activeIndex];
      itemData.activeIndex = itemData.activeIndex || 0;
      return;
    }

    // 设置默认的 active 状态
    if (option.historyEnable) {
      var key = this.root.getHistoryValue(option.historyKey);
      var typeKey = this.root.getHistoryValue(option.historyTypeKey);
      var item = this._findDataItem(key);
      var activeIndex,
        activeTypeIndex;

      if (item) {
        this.option.activeIndex = activeIndex = this.option.datas.indexOf(item);
      } else {
        this.option.activeIndex = activeIndex = 0;
        item = option.datas[activeIndex];
      }

      if (typeKey && item.types) {
        item.types.forEach(function (type, index) {
          if (type == typeKey) {
            item.activeIndex = index;
          }
        });
      } else {
        item.activeIndex = 0;
      }
    }
  }

  setRoot (root) {
    this.root = root;

    // 如果可以改变 hash
    if (this.option.historyEnable) {
      this.root.on('hashchange', (e, hashData) => {
        var key = this.root.getHistoryValue(this.option.historyKey)
          || this.option.datas[this.option.activeIndex].key;

        var item = this._findDataItem(key);
        var type = this.root.getHistoryValue(this.option.historyTypeKey);

        if (!type && item.types) {
          type = item.types[item.activeIndex];
        }

        this.activeSort(key, type, true);
      });
    }
  }

  reset (preventDisptach) {
    var defaultSort = this.option.datas[0];

    this.activeSort(defaultSort.key, defaultSort.types && defaultSort.types[0], preventDisptach);
  }

  getAddonData () {
    var self = this,
      $item = self._getContainer().find('.cdlist-sort-item-active'),
      data;

    if ($item.length > 0) {
      data = {
        key: $item.data('sort-key'),
        type: $item.data('sort-type')
      }
    }

    return data;
  }
}

Sort.SORT_MAP = {
 ASC: 'asc',
 DESC: 'desc'
}

export default Sort;
