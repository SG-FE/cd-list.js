/**
 * 通用的 input 输入框
 */
var template = require('../template');

import $ from 'jquery'
import mixin from '../tools/mixin.js';
import EventMixin from '../tools/event.js';

const TPL_INPUT = '<div class="cdlist-inputs-container"></div>';

let _option = {
  resetList: ['pagination', 'filter', 'sort'],
  allowEqual: false
}

let _addonName = 'inputs'

export default class Inputs extends mixin(EventMixin) {
  constructor (option) {
    super();

    if (option.historyEnable) {
      option.historyKey = option.historyKey || 'query';
    }

    this.option = Object.assign({}, _option, option);

  }

  _triggerResetEvent (preventSet) {
    this.option.resetList.forEach((addonName) => {
      this.root.trigger(addonName + '.reset', [preventSet])
    });
  }

  getName () {
    return _addonName;
  }

  _getContainer () {
    return this.option.container ? $(this.option.container) : this.root.$topPluginContainer;
  }

  /**
   * filter 的 view 渲染
   */
  initView () {
    this._getHTML();
    this._initEvent();
  }

  /**
   * 注册事件
   */
  _initEvent () {
    if (this.option.enableEnter) {
      this.$inputs.on('keydown', (e) => {
        if (e.keyCode == 13) {
          let $input = $(e.target);

          this.setValue($input.prop('name'), $input.val());
        }
      });
    }
  }

  /**
   * 重置 search addon
   */
  reset () {
    this.$input.val("");
  }

  /**
   * 生成 html 数据，并且插入新生成的 input
   */
  _getHTML () {
    this._dealInputsData();

    let $inputs = this._generateInputs();
    let $newInputs = $([]);
    let $root = $(TPL_INPUT);

    $inputs.each(function () {
      if ($(this).data('create')) {
        $newInputs = $newInputs.add($(this));
      }
    });

    if ($newInputs.length) {
      $root.append($newInputs);
    }

    this.$inputs = $inputs;

    this._getContainer().append($root);
  }

  _generateInputs () {
    var $inputs = $([]);

    this.option.datas.forEach(function (data) {
      if (data.selector) {
        let $input = $(data.selector);

        $input.prop('name', data.name);

        data.placeholder && $input.prop('placeholder', data.placeholder);
        data.val !== undefined && $input.val(data.val) && $input.data('val', data.val);

        $inputs = $inputs.add($input);
      } else {
        let $input = $('<input />');

        $input.addClass(data.className)
          .prop('name', data.name)
          .prop('placeholder', data.placeholder)
          .data('create', 1);

        if (data.val !== undefined) {
          $input.val(data.val);
          $input.data('val', data.val);
        }

        $inputs = $inputs.add($input);
      }
    });

    return $inputs;
  }

  /**
   * 处理数据默认数据
   */
  _dealInputsData () {
    this.option.datas.forEach((data) => {
      if (this.option.historyEnable) {
        let historyKey = data.historyKey || data.name;
        let historyValue = this.root.getHistoryValue(historyKey);


        if (historyValue) {
          if (data.regex && data.regex.test(historyValue)) {
            data.val = historyValue;
          } else if (!data.regex) {
            data.val = historyValue;
          }
        }
      }
    });
  }

  setValue (name, val, preventHistory) {
    if (this._getNames().indexOf(name) == -1) {
      return;
    }

    let oriValue = Inputs.prototype.getAddonData.apply(this);

    if (oriValue[name]  == val && !this.option.allowEqual) {
      return;
    }

    let data = this._getDataByName(name);
    let input = this._getInputByName(name);

    // 判断 regex
    // 正则校验失败触发 error
    if (data.regex && !data.regex.test(val)) {
      $(input).val(oriValue[name]);
      this.trigger('error', [input, val]);
      return;
    } else {
      $(input).val(val).data('val', val || null);
    }

    // set history
    if (!preventHistory && this.option.historyEnable) {
      let historyKey = this._getDataByName(name).historyKey || name;

      this.root.setHistory(historyKey, val);
    }


    // 未开启 history 模式总是重置，开启时非preventSet时才重置
    if (this.option.historyEnable && !preventHistory) {
      this._triggerResetEvent(preventHistory);
    } else if (!this.option.historyEnable) {
      this._triggerResetEvent(preventHistory);
    }

    this.option.onChange && this.option.onChange();

    this.root.trigger('reflow');
  }

  _getInputByName (name) {
    return this.$inputs.filter((idx, input) => {
      if ($(input).prop('name') == name) {
        return true;
      }
    })[0];
  }

  _getDataByName (name) {
    return this.option.datas.filter((data) => {
      if (data.name == name) {
        return true;
      }
    })[0];
  }

  _getNames () {
    return this.option.datas.map((data) => {
      return data.name;
    });
  }

  setRoot (root) {
    this.root = root;

    if (this.option.historyEnable) {
      this.root.on('hashchange', (e, hashData) => {
        this.option.datas.forEach((data) => {
          var historyValue = this.root.getHistoryValue(data.historyKey || data.name);

          this.setValue(data.name, historyValue, true);
        });
      });
    }
  }

  /**
   * 获取 addon 提供的 url 数据
   */
  getAddonData () {
    var datas = {};

    this.$inputs.each(function () {
      var name = $(this).prop('name');

      datas[name] = $(this).data('val');
    });

    return datas;
  }
}
