(function(_, $) {
    
    var Fanbase = {
        T : 0,
        hasMore : true,
        ajaxMore : (window.URL + 'example.php?more='),
        ajaxSearch : (window.URL + 'example.php?q='),
        hasSearch : true,
        caches : {},
        onscroll : [],
        searchTemplate : _.template(
          '<div class="media complete-search-item">' +
            '<a href="<%=the_link%>" class="pull-right"><img class="avatar" src="<%=the_avatar%>" alt="logo" /></a>' +
            '<div class="media-body">' +
              '<h4><a href="<%=the_link%>"><%=the_title%></a></h4>' +
              '<p><%=the_content%></p>' +
            '</div>' +
          '</div>'
        ),
        loadMoreTemplate : _.template(
          '<li class="card post">' +
            '<div class="title-bar clearfix">' +
              '<div class="pull-right date-public"><%=time_created%></div>' +
              '<h2><a href="<%=link%>"><img src="assets/images/espn.png" alt=""/><%=title_short%></a></h2>' +
            '</div>' +
            '<div class="feature-media"><%=featureMedia%></div>' +
            '<div class="post-content">' +      
            '<h3><a href="<%=link%>"><%=title%></a></h3>' +
            '<p><%=description_short%></p>' +
            '</div>' +
          '</li>'
        ),
        init : function() {
            var menu = "div#menu";
            if($(menu).length > 0) {
              var targetMenu = "div#targetMenu";
              var CTAbutton = "div#banner div.subscriber .btn";
              $('body').append($(menu).clone().attr('id', 'targetMenu'));
              $(targetMenu).find('ul').append("<li id='subscriber-item'></li>");
              $('#subscriber-item').append($(CTAbutton).clone());
              $(targetMenu).find('.container').css('max-width', 'none')
                           .css({'background': '#fff'});
              window.show = false;
              //
              Fanbase.showTopMenu();
              Fanbase.onscroll.push(Fanbase.showTopMenu);
            }
            Fanbase.onscroll.push(Fanbase.doLoadMore);
            //
            $(window).scroll(function() {
                Fanbase.pinned($('.side-units'), 10);
                for(var i = 0; i < Fanbase.onscroll.length; ++i) {
                  Fanbase.onscroll[i]();
                }
            });
            Fanbase.pinned($('.side-units'), 10);
            //
            $('input.input-search').on('keyup', function() {
                 var val = $('input.input-search').val();
                 if(val && val.length > 0) {
                        Fanbase.search(val);
                 } else {
                     $('div.auto-complete-search').html('').hide(); 
                 }
            })
            .on('focus', function() {
                if($('div.auto-complete-search').find('div').length > 0) {
                    $('div.auto-complete-search').show();
                }
            })
            .on('blur', function() {
                $('div.auto-complete-search').hide();
            });
            //
            $(window).resize(function(evt) {
                var width = $('body').width();
                //
                if(width > 767) {
                    Fanbase.pinned($('.side-units'), 10);
                    var pinned = $('#main-content').find('div.pinned');
                    if(pinned.length > 0) {
                        if(width < 950) {
                            pinned.width( $('#main-content').find('.left-bar').width());
                        } else {
                            pinned.css('width', '');
                        }
                    }
                } else {
                    $('#main-content').find('div.pinned').removeClass('pinned');
                }
            });
        },
        doLoadMore : function() {
            if(Fanbase.scrollHasLoadMore()) {
                if(Fanbase.TS) {
                    clearTimeout(Fanbase.TS);
                }
                window.TS = setTimeout(function(){
                    Fanbase.loadMore();
                    clearTimeout(Fanbase.TS);
                    Fanbase.TS = null;
                }, 200);
            }
        },
        scrollHasLoadMore : function() {
            return ($('body').height() - $(window).scrollTop() - $(window).height() <= 66);    
        },
        showTopMenu : function() {
            var width = $('body').width();
            if(width > 767) {
                var docScrollTop = parseInt($(window).scrollTop());
                var mainBodyOffsetTop = parseInt($('#main-content').offset().top);
                if ((mainBodyOffsetTop < (docScrollTop + 50))) {
                    if(window.show == false) {
                        window.show = true;
                        var mW = $(menu).find('.container').width();
                        var ctn = $(targetMenu).show().find('.container').width(mW);
                        var Int = window.setInterval(function(){
                            if(mW < width) {
                                 ctn.width(mW);
                                 mW += 10;    
                            } else {
                                ctn.width('auto');
                                window.clearInterval(Int);
                            }
                        }, 20);
                    }
                } else {
                    $(targetMenu).hide();
                    window.show = false;
                }
            }
        },
        pinned : function(elm, delta) {
            if(elm.length == 0) {
                return;    
            }
            var pr = elm.parent();
            var elmFullHieight = pr.offset().top + pr.height() + delta;
            var windowCurrentHeight = $(window).scrollTop() + $(window).height();
            if(elmFullHieight <= windowCurrentHeight && $(targetMenu).css('display') != 'none') {
                if(! elm.hasClass('pinned') && pr.css('display') != 'none') {
                    if(pr.height() > 0) {
                        pr.css('height', pr.height());
                    }
                    elm.addClass('pinned');
                }
                var max = $(window).height() - $(targetMenu).height();
                if(max > pr.height()) {
                    elm.css('bottom', 'auto').css('top', $(targetMenu).height());
                } else {
                    elm.css('bottom', '').css('top', '');
                }
            } else {
                elm.removeClass('pinned');
                pr.css('height', '').css('bottom', '').css('top', '');
            }
        },
        buildSearch : function(datas) {
            $('div.auto-complete-search').html('');
            if (datas && datas.length > 0) {
                for(var i = 0; i < datas.length; ++i) {
                    var data = datas[i];//
                    data.the_avatar = data.the_avatar || 'https://d3bn37nfny3y6t.cloudfront.net/images/silhouette_avatar.jpg';
                    var template = Fanbase.searchTemplate(data);
                    //
                    $('div.auto-complete-search').append(template).show();
                }
            } else {
                $('div.auto-complete-search').hide();
            }
        },
        search : function(q) {
            //cache result
            var key = q.replace(/[^a-zA-Z0-9]/g, '_').replace(/ /, '_');
            var datas = Fanbase.caches['q_' + key];
            if(datas) {
                Fanbase.buildSearch(datas);
            } else {
                Fanbase.X = false;
                $.getJSON(
                    (Fanbase.ajaxSearch + encodeURI(q)), 
                    function(datas) {
                        Fanbase.X = true;
                        window.TS = setTimeout(function(){
                            if(Fanbase.X) {
                                Fanbase.buildSearch(datas);
                            }
                            clearTimeout(Fanbase.TS);
                            Fanbase.TS = null;
                        }, 50);
                        Fanbase.caches['q_' + key] = datas;
                    }
                );
            }
        },
        loadMore : function() {
            if (Fanbase.hasMore && $('#card-grid').length > 0) {
                Fanbase.hasMore = false;
                $.getJSON(
                    (Fanbase.ajaxMore + Fanbase.T), 
                    function(data) {
                        if (data && data.title) {
                            data.featureMedia = (data.content_type === 'video') ? data.embed_code : '<img src="' + data.image_url + '"/>';
                            var template = Fanbase.loadMoreTemplate(data);
                            //
                            $('#card-grid').append(template);
                            Fanbase.T += 1;
                            Fanbase.hasMore = true;
                        }
                    }
                );
            }
        },
        timeSince : function (timestamp) {
            var seconds = Math.floor((new Date().getTime()/ 1000) - timestamp);
            var interval = Math.floor(seconds / 86400);
            if (interval > 35) {
                return date.format("M d, Y");
            }
            if (interval > 31) {
                return interval + " month ago";
            }
            if (interval > 1) {
                return interval + " days ago";
            }
            interval = Math.floor(seconds / 3600);
            if (interval > 23) {
                return "1 day ago";
            }
            if (interval > 1) {
                return interval + " hours ago";
            }
            interval = Math.floor(seconds / 60);
            if (interval > 59) {
                return "1 hour ago";
            }
            if (interval > 1) {
                return interval + " minutes ago";
            }
            if (seconds > 1) {
                return Math.floor(seconds) + " seconds ago";
            } else {
                return "right now"
            }
        }
    };
    
    $(function($){
        Fanbase.init();
    });
    window.Fanbase = Fanbase;
    //
    return Fanbase;
})(_, Zepto);
