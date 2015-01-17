(function($) {
  var Fanbase  = {
      T : 0,
      hasMore : true,
      init : function() {
          var menu = "div#menu";
          var targetMenu = "div#targetMenu";
          $('body').append($(menu).clone().attr('id', 'targetMenu'));
          $(targetMenu).find('.container').css('max-width', 'none')
                       .css({'background': '#fff', 'box-shadow' : 'gray 2px 0px 5px'});
          window.show = false;
          //
          $(window).scroll(function() {
              Fanbase.showTopMenu();
              //
              Fanbase.pinned($('.side-units'), 10);
              //
              if(Fanbase.scrollHasLoadMore()) {
                Fanbase.loadMore();
              }
          });
          //
          Fanbase.showTopMenu();
          Fanbase.pinned($('.side-units'), 10);

          $(window).resize(function(){
            var width = $('body').width();
            $('#targetMenu .container').width(width);
          });
          // auto search complete
           $('.input-search').on('keydown',function(){
             $(this).next('.auto-complete-search').addClass('active');
              $('.auto-complete-search').on('mouseleave',function(){
                   $(this).removeClass('active');
              })
          });
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
                   mW += 18;  
                } else {
                  ctn.width(width);
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
        if(elmFullHieight <= windowCurrentHeight) {
           if(! elm.hasClass('pinned')) {
             pr.css('height', pr.height());
             elm.addClass('pinned');
           }
        } else {
          elm.removeClass('pinned');
          pr.css('height', '');
        }
      },
      loadMore : function() {
        if (Fanbase.hasMore) {
            Fanbase.hasMore = false;
            $.getJSON(
              (window.URL + 'example.php?more=' + Fanbase.T), 
              function(data) {
                if (data && data.title) {
                  var template = $('#cardTemplate').html();
                  template = template.replace('{time}', Fanbase.timeSince(data.time_created));
                  template = template.replace(/{featureLink}/g, data.link);
                  template = template.replace('{subTitle}', data.title_short);
                  template = template.replace('{fullTitle}', data.title);
                  template = template.replace('{description}', (data.description_short) ? data.description_short : '');
                  //
                  template = template.replace('{featureMedia}', 
                                (data.content_type === 'video') ? data.embed_code : '<img src="' + data.image_url + '"/>');
                  //
                  $('#card-grid').append(template);
                  Fanbase.T += 1;
                  Fanbase.hasMore = true;
                }
              }
						);
        }
      },
      timeSince : function (time) {

        var seconds = Math.floor((new Date().getTime()/ 1000) - time );

        var interval = Math.floor(seconds / 31536000);

        if (interval > 1) {
            return interval + " years";
        }
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) {
            return interval + " months";
        }
        interval = Math.floor(seconds / 86400);
        if (interval > 1) {
            return interval + " days";
        }
        interval = Math.floor(seconds / 3600);
        if (interval > 1) {
            return interval + " hours";
        }
        interval = Math.floor(seconds / 60);
        if (interval > 1) {
            return interval + " minutes";
        }
        return Math.floor(seconds) + " seconds";
    }
      
  };
  
  $(function($){
    Fanbase.init();
  });
  
})(Zepto);
