define(function(require, exports, module) {
  'use strict';
  var _view = require('mock.view'),
    _util = require('mock.util'),
    notify = require('mock.plugin.notify');

  $.widget('mock.raws', _view, {
    options: {
      getaudinewsbyvid: 'http://uil.shahe.baidu.com/mock/getaudinewsbyvid?ua=bd_720_1280_HTC-HTC+One+X-4-0-4_4-2-6-1_j2&cuid=80000000000000000000000000000000|0&fn=?',
      audinewsdo: 'http://uil.shahe.baidu.com/mock/audinewsdo?ua=bd_720_1280_HTC-HTC+One+X-4-0-4_4-2-6-1_j2&cuid=80000000000000000000000000000000|0&fn=?',
      deleteaudinews: 'http://uil.shahe.baidu.com/mock/deleteaudinews?ua=bd_720_1280_HTC-HTC+One+X-4-0-4_4-2-6-1_j2&cuid=80000000000000000000000000000000|0&fn=?',
      ps: 1
    },
    render: function(opt) {
      var options = this.options;
      _.extend(options, opt);
      this._createWrapperElem();
    },
    renderTable: function() {
      var self = this,
        options = this.options;
      this._updateWrapperElemStatus();
      $.ajax({
        url: options.getaudinewsbyvid,
        crossDomain: true,
        dataType: 'jsonp',
        data: {
          type: options.type,
          pn: options.pn,
          ps: options.ps
        }
      }).done(function(res) {
        if (!res.errno) {
          options.allcount = res.data.allcount;
          options.totalpage = Math.ceil(options.allcount / options.ps);
          self._updatePagingStatus();
          $('#raws-table').addClass('hide').empty().append(self._createTableElem(res.data.list)).removeClass('hide');
        } else {
          notify({
            tmpl: 'error',
            text: res.error
          })
        }
      });
    },
    reRender: function(opt) {
      var options = this.options;
      _.extend(options, opt);
      this.renderTable();
    },
    _bindEvents: function() {
      this._on(this.element, {
        'click li.tab-nav-item': this._goPage,
        'click div.data-edit': this._editRaw,
        'click div.data-audit': this._auditRaw,
        'click div.page_pre': this._preGoSiblingPage,
        'click div.page_next': this._preGoSiblingPage,
        'click div.page_go': this._preGoSiblingPage
      });
    },
    _createWrapperElem: function() {
      var options = this.options,
        h = [];
      h.push('<div class="mock-hd">原始内容管理</div>');
      h.push('<div class="page-content">');
      h.push('<ul class="tabs-nav">');
      h.push('<li class="tab-nav-item" data-type="2"><a>已上线</a></li>');
      h.push('<li class="tab-nav-item" data-type="1"><a>待审核</a></li>');
      h.push('<li class="tab-nav-item" data-type="0"><a>已保存</a></li>');
      h.push('<li class="tab-nav-item" data-type="3"><a>已删除</a></li>');
      h.push('</ul>');
      h.push('<div class="tabs-content">');
      // h.push('<div class="mock-search-box"><input type="search" placeholder="按关键词搜索" class="form-control mock-search"><div class="mock-search-icon"></div></div>');
      h.push('<table class="table table-bordered table-hover" id="raws-table">');
      h.push('</table>');
      h.push('<div class="paging hide">');
      h.push('<div class="mock-btn mock-btn-white page_pre">&lt;</div>');
      h.push('<div class="page_num"><span class="page_current"></span><span class="num_gap">/</span><span class="page_total"></span>');
      h.push('</div>');
      h.push('<div class="mock-btn mock-btn-white page_next">&gt;</div>');
      h.push('<input type="text" class="form-control goto_page">');
      h.push('<div class="mock-btn mock-btn-white page_go">跳转</div>');
      h.push('</div>');
      h.push('</div>');
      h.push('</div>');
      this.element.append(h.join(''));
      this.renderTable();
    },
    _goSiblingPage: function(pn) {
      var router = new Backbone.Router;
      router.navigate('raws/' + this.options.type + '/' + pn, {
        trigger: true
      });
      return false;
    },
    _createTableElem: function(data) {
      var options = this.options;
      switch (options.type) {
        case '0':
          return this._createSaveTable(data);
          break;
        case '1':
        case '3':
          return this._createCommonTable(data);
          break;
        case '2':
          return this._createOnlineTable(data);
          break;
      }
    },
    _createSaveTable: function(data) {
      var h = [];
      h.push('<thead><tr><th>id</th><th>内容标题</th><th>上线时间</th><th>操作</th></tr></thead>');
      h.push('<tbody>');
      if (!_.isEmpty(data)) {
        _.each(data, function(item, index) {
          h.push('<tr><td>' + item.id + '</td><td>' + item.title + '</td><td>' + _util.dateFormat(item.uptime * 1000, 'yyyy-MM-dd hh:mm') + '</td><td>');
          h.push('<div class="mock-btn mock-btn-red  mock-btn-s data-audit" data-id="' + item.id + '">提交</div>');
          h.push('<div class="mock-btn mock-btn-red  mock-btn-s data-edit" data-id="' + item.id + '">修改</div>');
          h.push('</td></tr>');
        });
      } else {
        h.push('<tr><td colspan="4">没有数据</td></tr>');
      }
      h.push('</tbody>');
      return h.join('');
    },
    _createOnlineTable: function(data) {
      var h = [];
      h.push('<thead><tr><th>id</th><th>内容标题</th><th>上线时间</th><th>是否置顶</th></tr></thead>');
      h.push('<tbody>');
      if (!_.isEmpty(data)) {
        _.each(data, function(item, index) {
          h.push('<tr><td>' + item.id + '</td><td>' + item.title + '</td><td>' + _util.dateFormat(item.uptime * 1000, 'yyyy-MM-dd hh:mm') + '</td><td><input type="checkbox"></td></tr>');
        });
      } else {
        h.push('<tr><td colspan="4">没有数据</td></tr>');
      }
      h.push('</tbody>');
      return h.join('');
    },
    _createCommonTable: function(data) {
      var h = [];
      h.push('<thead><tr><th>id</th><th>内容标题</th><th>上线时间</th></tr></thead>');
      h.push('<tbody>');
      if (!_.isEmpty(data)) {
        _.each(data, function(item, index) {
          h.push('<tr><td>' + item.id + '</td><td>' + item.title + '</td><td>' + _util.dateFormat(item.uptime * 1000, 'yyyy-MM-dd hh:mm') + '</td></tr>');
        });
      } else {
        h.push('<tr><td colspan="3">没有数据</td></tr>');
      }
      h.push('</tbody>');
      return h.join('');
    },
    _goPage: function(event) {
      var type = $(event.target).closest('li.tab-nav-item').attr('data-type');
      var router = new Backbone.Router;
      router.navigate('raws/' + type, {
        trigger: true
      });
      return false;
    },
    _editRaw: function(event) {
      var id = $(event.target).attr('data-id'),
        router = new Backbone.Router;
      router.navigate('rawedit/' + id, {
        trigger: true
      });
      return false;
    },
    _auditRaw: function(event) {
      var options = this.options,
        id = $(event.target).attr('data-id');
      $.ajax({
        url: options.audinewsdo,
        crossDomain: true,
        dataType: 'jsonp',
        data: {
          id: id,
          tp: 3
        }
      }).done(function(res) {
        if (!res.errno) {
          $(event.target).closest('tr').remove();
        } else {
          notify({
            tmpl: 'error',
            text: res.error
          });
        }
      });
      return false;
    }
  });
  module.exports = $.mock.raws;
});