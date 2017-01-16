import template from '../template.js';

/**
 * 从 jsmod ui 类库中引入分页插件
 * MIT Licensed
 */
let _option = {
  currentPage: 0,
  maxShowPage: 10,
  textLabel: ['首页', '上一页', '下一页', '尾页'],
  pageLabel: '{#0}',
  preventInitEvent: false
};

const PAGE_TPL = '' +
 '<div class="mod-page">' +
   '<% for (var i = 0; i < renderDatas.length; i++) { %>' +
     '<a href="javascript:void(0);" <% if (renderDatas[i].page !== undefined) { %> data-page="<%= renderDatas[i].page %>" <% } %> class="mod-page-item <%= renderDatas[i].className %>"><%= renderDatas[i].label %></a>' +
   '<% } %>' +
 '</div>';

import EventMixin from './event.js';
import mixin from './mixin.js';

/**
 * 分页控件，无需写 html ，提供一个 div 节点自动生成所有的分页所需标签
 * @alias module:jsmod/ui/pagination
 * @constructor
 * @param {(dom|string)}      element                                                          分页控件的容器
 * @param {object}            option                                                           分页控件配置参数
 * @param {int}               option.pageCount                                                 一共有多少页
 * @param {int}               [option.currentPage=0]                                           当前页
 * @param {int}               [option.maxShowPage=10]                                          最多显示分页个数
 * @param {array}             [option.textLabel=new Array('首页', '上一页', '下一页', '尾页')] 几个特殊关键字
 * @param {(string|function)} [option.pageLabel={#0}]                                          字符串用 {#0} 代表当前页, 函数则取返回值作为显示。函数其参数 page 为索引计数（起始0）；而替换字符串为 page + 1
 * @param {bool}              [option.preventInitEvent=false]                                  是否阻止初始化时触发事件
 * @param {bool}              [option.allwaysShow=false]                                       是否总是显示
 * @example
 * var Pagination = require("jsmod/ui/pagination");
 *
 * // 创建实例
 * new Pagination("#page-container", {pageCount: 20});
 */
export default class Pagination extends mixin(EventMixin) {
  constructor (element, option) {
    super();

    var self = this;

    self.element = $(element);
    self.option = $.extend({}, _option, option);

    self.generatePage();
  }
  /**
   * @private
   * @description 生成分页控件、包括html、event
   */
  generatePage () {
    var self = this,
      option = self.option,
      renderDatas, html;

    self.generateEvents();

    if (option.pageCount < option.maxShowPage) {
      option.maxShowPage = option.pageCount;
    }

    if (option.preventInitEvent) {
      self.setPage(option.currentPage);
    } else {
      // 异步处理是因为需要获取page对象并绑定事件
      setTimeout(function() {
        self.setPage(option.currentPage);
      }, 0);
    }
  }

  /**
   * 手动设置当前页
   * @public
   * @param {int} page 当前页
   * @fires module:jsmod/ui/pagination#page
   */
  setPage (page, preventDisptach) {
    var self = this,
      html, e;

    html = self.getHTML(self.getRenderDatas(page));
    self.element.html(html);

    /**
     * 设置page触发的事件，重复设置相同page会触发多次事件
     * @event module:jsmod/ui/pagination#page
     * @type {object}
     * @property {int} page 当前设定的page值
     */
    if (!preventDisptach) {
      self.trigger('page', [self.currentPage]);
    }
  }

  /**
   * 获取当前的 page
   * @public
   */
  getPage () {
    return this.currentPage;
  }

  /**
   * @private
   * @description 生成事件
   */
  generateEvents () {
    var self = this,
      element = self.element,
      option = self.option;

    element.undelegate("click.page");
    element.delegate("[data-page]:not(.mod-page-item-disabled)", "click.page", function(e) {
      var page = $(this).data("page");

      if ($.isNumeric(page)) {
        self.setPage(page);
      } else if (page == "+") {
        self.setPage(self.currentPage + 1);
      } else if (page == "-") {
        self.setPage(self.currentPage - 1);
      }

      return false;
    });
  }

  /**
   * 清空分页容器，移除事件
   * @public
   */
  destroy () {
    this.element.undelegate("click.page");
    this.element.html("");
  }

  /**
   * @private
   * @description 获取HTML代码
   * @param {array} renderDatas 渲染分页的数据
   */
  getHTML (renderDatas) {
    var html;

    html = template(PAGE_TPL, {renderDatas: renderDatas});
    return html;
  }

  /**
   * @private
   * @description 获取分页渲染数据
   * @param {int} page 标示当前页
   * @return {array} renderDatas 渲染分页的数据
   */
  getRenderDatas (page) {
    var self = this,
      option = self.option,
      renderDatas = [],
      start, end, offsetEnd, offsetStart;

    page = parseInt(page);
    page = page < 0 ? 0 : page;
    page = page > option.pageCount - 1 ? option.pageCount - 1 : page;

    var flag = parseInt(option.maxShowPage / 3); // 分页渲染当前页的标识位

    start = page - flag < 0 ? 0 : page - flag; // start 位置
    offsetEnd = page - flag < 0 ? Math.abs(page - flag) : 0; // end 的偏移

    end = page + (option.maxShowPage - flag) - 1 > option.pageCount - 1 ? option.pageCount - 1 : page + (option.maxShowPage - flag) -1; // end 位置
    offsetStart = page + (option.maxShowPage - flag) - 1 > option.pageCount - 1 ? Math.abs(page + (option.maxShowPage - flag) - 1 - (option.pageCount - 1)) : 0 // start 的偏移

    start -= offsetStart;
    end += offsetEnd;

    if (page != 0 || option.allwaysShow) {
      // 处理固定的前两个数据
      $.each(option.textLabel.slice(0, 2), function(i, label) {
        if (i == 0 && label) {
          renderDatas.push({
            className: (page == 0) ? 'mod-page-item-first mod-page-item-disabled' : "mod-page-item-first",
            label: label,
            page: 0
          });
        }
        if (i == 1 && label) {
          renderDatas.push({
            className: (page == 0) ? "mod-page-item-prev mod-page-item-disabled" : "mod-page-item-prev",
            label: label,
            page: "-"
          });
        }
      });
    }

    // 处理页面信息
    for (start; start <= end; start++) {
      renderDatas.push({
        className: start == page ? "mod-page-item-active" : "",
        label: $.isFunction(option.pageLabel) ? option.pageLabel(start) : option.pageLabel.replace(/{#0}/g, start + 1),
        page: start
      });
    }

    if (page != option.pageCount - 1 || option.allwaysShow) {
      // 处理固定的后两个数据
      $.each(option.textLabel.slice(2, 4), function(i, label) {
        if (i == 0 && label) {
          renderDatas.push({
            className: (page == option.pageCount - 1) ? 'mod-page-item-next mod-page-item-disabled' : "mod-page-item-next",
            label: label,
            page: "+"
          });
        }
        if (i == 1 && label) {
          renderDatas.push({
            className: (page == option.pageCount - 1) ? 'mod-page-item-last mod-page-item-disabled' : "mod-page-item-last",
            label: label,
            page: option.pageCount - 1
          });
        }
      });
    }

    // 设置当前页码
    self.currentPage = page;

    return renderDatas;
  }
}
