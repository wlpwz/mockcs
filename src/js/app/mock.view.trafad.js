define(function(require, exports, module) {
    'use strict';
    var _view = require('mock.view'),
        _util = require('mock.util'),
        getTongjiNewsUrl = function(beginTime, endTime, type) {
            return _util.getApiUrl({
                "name": "tongad",
                "params": {
                    'bt':Math.floor(beginTime/1000),
                    'et':Math.floor(endTime/1000),
                    'tp':type
                }
            });
        },
        getTongjiNewsData = function(beginTime,endTime,type){
            var url = getTongjiNewsUrl(beginTime,endTime,type);
            return  $.ajax({
                url: url,
                crossDomain: true,
                dataType: 'jsonp',
            }).done;
        };

    $.widget('mock.trafad', _view, {
        options: {
            url: '',
            ps: 30
        },
        render: function(opt) {
            var options = this.options;
            _.extend(options, opt);
            this._createWrapperElem();
        },
        reRender: function(opt) {
            var options = this.options;
            _.extend(options, opt);
            this.renderContent();
        },
        renderContent: function() {
            var self = this,
                options = this.options,
                stype = options.stype;
            this._updateWrapperElemStatus(stype);
            this._updateWrapperElemStatus(stype);
            if(!self.beginDate || !self.endDate){
                var currentDate = new Date();
                self.endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23,59,59,999);
                self.beginDate = new Date(self.endDate.getTime() - 7*24*60*60*1000);
            }
            getTongjiNewsData(self.beginDate.getTime(), self.endDate.getTime(),stype)(function(result){
                self._updateOverallElem(result.data.today);
                self._updateDetailElem(result.data.tong);
                self._updateFigure(result.data.tong);
            });
        },
        _createWrapperElem: function() {
            var h = [],
            template = 
'<div class="mock-hd">广告流量数据分析</div>'+
'<div class="page-content">'+
    '<ul class="tabs-nav">'+
        '<li class="tab-nav-item" data-type="0">'+
            '<a>个人主页</a>'+
        '</li>'+
        '<li class="tab-nav-item" data-type="1">'+
            '<a>原创吐槽内容</a>'+
        '</li>'+
    '</ul>'+
    '<div class="tabs-content">'+
        '<ul class="traf-overall" id="trafad-overall">'+
        '</ul>'+
        '<ul class="tabs-period">'+
            '<li class="tab-period-item tab-period-item-selected" data-period="7">最近7天</li>'+
            '<li class="tab-period-item" data-period="14">最近14天</li>'+
            '<li class="tab-period-item" data-period="30">最近30天</li>'+
            '<li>'+
                '<input type="text" class="form-control traf-period-date bgwhite" id="fromdate" readonly="readonly"/>至<input type="text" class="form-control traf-period-date bgwhite" id="todate" readonly="readonly"/><div class="mock-btn mock-btn-red mock-btn-search ml5" id="btnSearch">搜索</div>'+
            '</li>'+
        '</ul>'+
        '<div id="trafad-figure"></div>'+
        '<table class="table table-bordered" id="trafuser-detail"></table>'+
    '</div>'+
    '<div class="paging hide">'+
        '<div class="mock-btn mock-btn-white page_pre hide">&lt;</div>'+
        '<div class="page_num">'+
            '<span class="page_current"></span><span class="num_gap">/</span><span class="page_total"></span>'+
        '</div>'+
        '<div class="mock-btn mock-btn-white page_next hide">&gt;</div>'+
        '<input type="text" class="form-control goto_page">'+
        '<div class="mock-btn mock-btn-white page-go">跳转</div>'+
    '</div>'+
'</div>';
            this.element.append(template);
            this.renderContent();
            this.element.find('input.traf-period-date').datetimepicker({
                format: 'Y-m-d',
                timepicker: false,
                lang: 'ch'
            });
        },
        _updateFigure: function(data) {
            //ref: http://bl.ocks.org/mbostock/3883245
            this.element.find('#trafad-figure').empty();
             var margin = {
                    top: 20,
                    right: 80,
                    bottom: 30,
                    left: 80
                },
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var parseDate = d3.time.format('%Y-%m-%d').parse;

            var x = d3.time.scale()
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var color = d3.scale.category10();

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom');

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient('left');

            var line = d3.svg.line()
                .interpolate('basis')
                .x(function(d) {
                    return x(d.date);
                })
                .y(function(d) {
                    return y(d.num);
                });

            var svg = d3.select('#trafad-figure').append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // d3.json('../../data/user.json', function(error, data) {

                color.domain(d3.keys(data[0]).filter(function(key) {
                    return key !== 'date';
                }));

                data.forEach(function(d) {
                    d.date = new Date(d.date*1000);
                });

                var cities = color.domain().map(function(name) {
                    return {
                        name: name,
                        values: data.map(function(d) {
                            return {
                                date: d.date,
                                num: +d[name]
                            };
                        })
                    };
                });

                x.domain(d3.extent(data, function(d) {
                    return d.date;
                }));

                y.domain([
                    d3.min(cities, function(c) {
                        return d3.min(c.values, function(v) {
                            return v.num;
                        });
                    }),
                    d3.max(cities, function(c) {
                        return d3.max(c.values, function(v) {
                            return v.num;
                        });
                    })
                ]);

                svg.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(xAxis);

                svg.append('g')
                    .attr('class', 'y axis')
                    .call(yAxis)
                    .append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('y', 6)
                    .attr('dy', '.71em')
                    .style('text-anchor', 'end')
                    .text('次数');

                var item = svg.selectAll('.item')
                    .data(cities)
                    .enter().append('g')
                    .attr('class', 'item');

                item.append('path')
                    .attr('class', 'line')
                    .attr('d', function(d) {
                        return line(d.values);
                    })
                    .style('stroke', function(d) {
                        return color(d.name);
                    });

                item.append('text')
                    .datum(function(d) {
                        return {
                            name: d.name,
                            value: d.values[d.values.length - 1]
                        };
                    })
                    .attr('transform', function(d) {
                        return 'translate(' + x(d.value.date) + ',' + y(d.value.num) + ')';
                    })
                    .attr('x', 3)
                    .attr('dy', '.35em')
                    .text(function(d) {
                        return d.name;
                    });
        },
        _updateOverallElem: function(data) {
            var options = this.options,
                stype = options.stype,
                template = '';
            switch (stype) {
                case '0': //个人主页
                template =
'<li class="traf-overall-item">'+
    '<div>个人主页广告浏览量</div>'+
    '<div class="traf-count"><%=pv%></div>'+
'</li>'+
'<li class="traf-overall-item">'+
    '<div>个人主页广告访问量</div>'+
    '<div class="traf-count"><%=uv%></div>'+
'</li>'+
'<li class="traf-overall-item">'+
    '<div>个人主页广告点展比</div>'+
    '<div class="traf-count"><%=parseInt(hit/pv*100)/100%></div>'+
'</li>';
                    break;
                case '1': //原创吐槽内容
                template =
'<li class="traf-overall-item">'+
    '<div>浏览量</div>'+
    '<div class="traf-count"><%=pv%></div>'+
'</li>'+
'<li class="traf-overall-item">'+
    '<div>访问量</div>'+
    '<div class="traf-count"><%=uv%></div>'+
'</li>'+
'<li class="traf-overall-item">'+
    '<div>点击到达率</div>'+
    '<div class="traf-count"><%=parseInt(hit/pv*100)/100%></div>'+
'</li>';
                    break;
            }
            this.element.find('#trafad-overall').empty().append(_.template(template)(data));
        },
        _updateDetailElem: function(data) {
            var options = this.options,
                dataset = {
                    format:_util.dateFormat,
                    data:data
                },
                stype = options.stype,
                template ='',
                h = [];
            switch (stype) {
                case '0': //个人主页
                template = 
                '<caption>详细数据</caption>'+
                '<thead>'+
                    '<tr>'+
                        '<th>日期</th>'+
                        '<th>浏览量</th>'+
                        '<th>访问量</th>'+
                        '<th>广告点击到达率</th>'+
                    '</tr>'+
                '</thead>'+
                '<tbody>'+
                    '<%for(var i=0;i<data.length;i++){%>'+
                        '<tr>'+
                            '<td><%=format(data[i].date*1000, "yyyy-MM-dd")%></td>'+
                            '<td><%=data[i].pv%></td>'+
                            '<td><%=data[i].uv%></td>'+
                            '<td><%=parseInt(data[i].hit/data[i].pv*100)/100%></td>'+
                        '</tr>'+
                    '<%}%>'+
                '</tbody>';
                    break;
                case '1': //原创吐槽内容
                    template = 
                    '<caption>详细数据</caption>'+
                    '<thead>'+
                        '<tr>'+
                            '<th>日期</th>'+
                            '<th>PV</th>'+
                            '<th>UV</th>'+
                            '<th>点展比</th>'+
                        '</tr>'+
                    '</thead>'+
                    '<tbody>'+
                        '<%for(var i=0;i<data.length;i++){%>'+
                            '<tr>'+
                                '<td><%=format(data[i].date*1000, "yyyy-MM-dd")%></td>'+
                                '<td><%=data[i].pv%></td>'+
                                '<td><%=data[i].uv%></td>'+
                                '<td><%=parseInt(data[i].hit/data[i].pv*100)/100%></td>'+
                            '</tr>'+
                        '<%}%>'+
                    '</tbody>';
                    break;
            }
            this.element.find('#trafuser-detail').empty().append(_.template(template)(dataset));
        },
        _bindEvents: function() {
            this._on(this.element, {
                'click li.tab-nav-item': this._goPage,
                'click .tab-period-item':this._selectedDays,
                'click div.page_pre': this._preGoSiblingPage,
                'click div.page_next': this._preGoSiblingPage,
                'click div.page_go': this._preGoSiblingPage,
                'click #btnSearch':this._search
            });
        },
        _search:function(){
            var inputFromdate = this.element.find('#fromdate');
            var inputTodate = this.element.find('#todate');
            var fromdate = inputFromdate.val().trim();
            var todate = inputTodate.val().trim();
            if(!fromdate || !/^\d{4}\-\d{2}\-\d{2}$/.test(fromdate)){
                inputFromdate.focus();
                inputFromdate.val('选择开始日期');
                return;
            }
            if(!todate || !/^\d{4}\-\d{2}\-\d{2}$/.test(todate)){
                inputTodate.focus();
                inputTodate.val('选择结束日期');
                return;
            }
            var tbeginDate = new Date(fromdate.replace(/\-/g,'\/')+" 0:0:0");
            var tendDate = new Date(todate.replace(/\-/g,'\/')+" 23:59:59");
            if(tbeginDate > tendDate){
                inputFromdate.val('须小于结束时间');
                inputFromdate.focus();
                return 
            }
            this.element.find('.tabs-period .tab-period-item').removeClass('tab-period-item-selected');
            this.beginDate = tbeginDate;
            this.endDate = tendDate;
            this.renderContent();
        },
        _selectedDays:function(e){
            var self = this,
                currentTarget = e.currentTarget,
                currentPeriod = $(currentTarget).attr('data-period'),
                currentDate = new Date();
            switch(currentPeriod){
                case '7':
                    self.endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23,59,59,999);
                    self.beginDate = new Date(self.endDate.getTime() - 7*24*60*60*1000);
                break;
                case '14':
                    self.endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23,59,59,999);
                    self.beginDate = new Date(self.endDate.getTime() - 14*24*60*60*1000);
                break;
                case '30':
                    self.endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23,59,59,999);
                    self.beginDate = new Date(self.endDate.getTime() - 30*24*60*60*1000);
                break;
            }
            $(currentTarget).parent().find('.tab-period-item').removeClass('tab-period-item-selected');
            $(currentTarget).addClass('tab-period-item-selected');
            self.renderContent();
        },
        _goPage: function(event) {
            var stype = $(event.target).closest('li.tab-nav-item').attr('data-type');
            var router = new Backbone.Router;
            router.navigate('trafad/' + stype, {
                trigger: true
            });
            return false;
        }
    });
    module.exports = $.mock.trafad;
});
