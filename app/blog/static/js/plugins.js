/*!
 * Lightbox v2.9.0
 * by Lokesh Dhakar
 *
 * More info:
 * http://lokeshdhakar.com/projects/lightbox2/
 *
 * Copyright 2007, 2015 Lokesh Dhakar
 * Released under the MIT license
 * https://github.com/lokesh/lightbox2/blob/master/LICENSE
 */

// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals (root is window)
        root.lightbox = factory(root.jQuery);
    }
}(this, function ($) {

  function Lightbox(options) {
    this.album = [];
    this.currentImageIndex = void 0;
    this.init();

    // options
    this.options = $.extend({}, this.constructor.defaults);
    this.option(options);
  }

  // Descriptions of all options available on the demo site:
  // http://lokeshdhakar.com/projects/lightbox2/index.html#options
  Lightbox.defaults = {
    albumLabel: 'Image %1 of %2',
    alwaysShowNavOnTouchDevices: false,
    fadeDuration: 600,
    fitImagesInViewport: true,
    imageFadeDuration: 600,
    // maxWidth: 800,
    // maxHeight: 600,
    positionFromTop: 50,
    resizeDuration: 700,
    showImageNumberLabel: true,
    wrapAround: false,
    disableScrolling: false,
    /*
    Sanitize Title
    If the caption data is trusted, for example you are hardcoding it in, then leave this to false.
    This will free you to add html tags, such as links, in the caption.

    If the caption data is user submitted or from some other untrusted source, then set this to true
    to prevent xss and other injection attacks.
     */
    sanitizeTitle: false
  };

  Lightbox.prototype.option = function(options) {
    $.extend(this.options, options);
  };

  Lightbox.prototype.imageCountLabel = function(currentImageNum, totalImages) {
    return this.options.albumLabel.replace(/%1/g, currentImageNum).replace(/%2/g, totalImages);
  };

  Lightbox.prototype.init = function() {
    var self = this;
    // Both enable and build methods require the body tag to be in the DOM.
    $(document).ready(function() {
      self.enable();
      self.build();
    });
  };

  // Loop through anchors and areamaps looking for either data-lightbox attributes or rel attributes
  // that contain 'lightbox'. When these are clicked, start lightbox.
  Lightbox.prototype.enable = function() {
    var self = this;
    $('body').on('click', 'a[rel^=lightbox], area[rel^=lightbox], a[data-lightbox], area[data-lightbox]', function(event) {
      self.start($(event.currentTarget));
      return false;
    });
  };

  // Build html for the lightbox and the overlay.
  // Attach event handlers to the new DOM elements. click click click
  Lightbox.prototype.build = function() {
    var self = this;
    $('<div id="lightboxOverlay" class="lightboxOverlay"></div><div id="lightbox" class="lightbox"><div class="lb-outerContainer"><div class="lb-container"><img class="lb-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" /><div class="lb-nav"><a class="lb-prev" href="" ></a><a class="lb-next" href="" ></a></div><div class="lb-loader"><a class="lb-cancel"></a></div></div></div><div class="lb-dataContainer"><div class="lb-data"><div class="lb-details"><span class="lb-caption"></span><span class="lb-number"></span></div><div class="lb-closeContainer"><a class="lb-close"></a></div></div></div></div>').appendTo($('body'));

    // Cache jQuery objects
    this.$lightbox       = $('#lightbox');
    this.$overlay        = $('#lightboxOverlay');
    this.$outerContainer = this.$lightbox.find('.lb-outerContainer');
    this.$container      = this.$lightbox.find('.lb-container');
    this.$image          = this.$lightbox.find('.lb-image');
    this.$nav            = this.$lightbox.find('.lb-nav');

    // Store css values for future lookup
    this.containerPadding = {
      top: parseInt(this.$container.css('padding-top'), 10),
      right: parseInt(this.$container.css('padding-right'), 10),
      bottom: parseInt(this.$container.css('padding-bottom'), 10),
      left: parseInt(this.$container.css('padding-left'), 10)
    };

    this.imageBorderWidth = {
      top: parseInt(this.$image.css('border-top-width'), 10),
      right: parseInt(this.$image.css('border-right-width'), 10),
      bottom: parseInt(this.$image.css('border-bottom-width'), 10),
      left: parseInt(this.$image.css('border-left-width'), 10)
    };

    // Attach event handlers to the newly minted DOM elements
    this.$overlay.hide().on('click', function() {
      self.end();
      return false;
    });

    this.$lightbox.hide().on('click', function(event) {
      if ($(event.target).attr('id') === 'lightbox') {
        self.end();
      }
      return false;
    });

    this.$outerContainer.on('click', function(event) {
      if ($(event.target).attr('id') === 'lightbox') {
        self.end();
      }
      return false;
    });

    this.$lightbox.find('.lb-prev').on('click', function() {
      if (self.currentImageIndex === 0) {
        self.changeImage(self.album.length - 1);
      } else {
        self.changeImage(self.currentImageIndex - 1);
      }
      return false;
    });

    this.$lightbox.find('.lb-next').on('click', function() {
      if (self.currentImageIndex === self.album.length - 1) {
        self.changeImage(0);
      } else {
        self.changeImage(self.currentImageIndex + 1);
      }
      return false;
    });

    /*
      Show context menu for image on right-click

      There is a div containing the navigation that spans the entire image and lives above of it. If
      you right-click, you are right clicking this div and not the image. This prevents users from
      saving the image or using other context menu actions with the image.

      To fix this, when we detect the right mouse button is pressed down, but not yet clicked, we
      set pointer-events to none on the nav div. This is so that the upcoming right-click event on
      the next mouseup will bubble down to the image. Once the right-click/contextmenu event occurs
      we set the pointer events back to auto for the nav div so it can capture hover and left-click
      events as usual.
     */
    this.$nav.on('mousedown', function(event) {
      if (event.which === 3) {
        self.$nav.css('pointer-events', 'none');

        self.$lightbox.one('contextmenu', function() {
          setTimeout(function() {
              this.$nav.css('pointer-events', 'auto');
          }.bind(self), 0);
        });
      }
    });


    this.$lightbox.find('.lb-loader, .lb-close').on('click', function() {
      self.end();
      return false;
    });
  };

  // Show overlay and lightbox. If the image is part of a set, add siblings to album array.
  Lightbox.prototype.start = function($link) {
    var self    = this;
    var $window = $(window);

    $window.on('resize', $.proxy(this.sizeOverlay, this));

    $('select, object, embed').css({
      visibility: 'hidden'
    });

    this.sizeOverlay();

    this.album = [];
    var imageNumber = 0;

    function addToAlbum($link) {
      self.album.push({
        link: $link.attr('href'),
        title: $link.attr('data-title') || $link.attr('title')
      });
    }

    // Support both data-lightbox attribute and rel attribute implementations
    var dataLightboxValue = $link.attr('data-lightbox');
    var $links;

    if (dataLightboxValue) {
      $links = $($link.prop('tagName') + '[data-lightbox="' + dataLightboxValue + '"]');
      for (var i = 0; i < $links.length; i = ++i) {
        addToAlbum($($links[i]));
        if ($links[i] === $link[0]) {
          imageNumber = i;
        }
      }
    } else {
      if ($link.attr('rel') === 'lightbox') {
        // If image is not part of a set
        addToAlbum($link);
      } else {
        // If image is part of a set
        $links = $($link.prop('tagName') + '[rel="' + $link.attr('rel') + '"]');
        for (var j = 0; j < $links.length; j = ++j) {
          addToAlbum($($links[j]));
          if ($links[j] === $link[0]) {
            imageNumber = j;
          }
        }
      }
    }

    // Position Lightbox
    var top  = $window.scrollTop() + this.options.positionFromTop;
    var left = $window.scrollLeft();
    this.$lightbox.css({
      top: top + 'px',
      left: left + 'px'
    }).fadeIn(this.options.fadeDuration);

    // Disable scrolling of the page while open
    if (this.options.disableScrolling) {
      $('body').addClass('lb-disable-scrolling');
    }

    this.changeImage(imageNumber);
  };

  // Hide most UI elements in preparation for the animated resizing of the lightbox.
  Lightbox.prototype.changeImage = function(imageNumber) {
    var self = this;

    this.disableKeyboardNav();
    var $image = this.$lightbox.find('.lb-image');

    this.$overlay.fadeIn(this.options.fadeDuration);

    $('.lb-loader').fadeIn('slow');
    this.$lightbox.find('.lb-image, .lb-nav, .lb-prev, .lb-next, .lb-dataContainer, .lb-numbers, .lb-caption').hide();

    this.$outerContainer.addClass('animating');

    // When image to show is preloaded, we send the width and height to sizeContainer()
    var preloader = new Image();
    preloader.onload = function() {
      var $preloader;
      var imageHeight;
      var imageWidth;
      var maxImageHeight;
      var maxImageWidth;
      var windowHeight;
      var windowWidth;

      $image.attr('src', self.album[imageNumber].link);

      $preloader = $(preloader);

      $image.width(preloader.width);
      $image.height(preloader.height);

      if (self.options.fitImagesInViewport) {
        // Fit image inside the viewport.
        // Take into account the border around the image and an additional 10px gutter on each side.

        windowWidth    = $(window).width();
        windowHeight   = $(window).height();
        maxImageWidth  = windowWidth - self.containerPadding.left - self.containerPadding.right - self.imageBorderWidth.left - self.imageBorderWidth.right - 20;
        maxImageHeight = windowHeight - self.containerPadding.top - self.containerPadding.bottom - self.imageBorderWidth.top - self.imageBorderWidth.bottom - 120;

        // Check if image size is larger then maxWidth|maxHeight in settings
        if (self.options.maxWidth && self.options.maxWidth < maxImageWidth) {
          maxImageWidth = self.options.maxWidth;
        }
        if (self.options.maxHeight && self.options.maxHeight < maxImageWidth) {
          maxImageHeight = self.options.maxHeight;
        }

        // Is there a fitting issue?
        if ((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight)) {
          if ((preloader.width / maxImageWidth) > (preloader.height / maxImageHeight)) {
            imageWidth  = maxImageWidth;
            imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
            $image.width(imageWidth);
            $image.height(imageHeight);
          } else {
            imageHeight = maxImageHeight;
            imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
            $image.width(imageWidth);
            $image.height(imageHeight);
          }
        }
      }
      self.sizeContainer($image.width(), $image.height());
    };

    preloader.src          = this.album[imageNumber].link;
    this.currentImageIndex = imageNumber;
  };

  // Stretch overlay to fit the viewport
  Lightbox.prototype.sizeOverlay = function() {
    this.$overlay
      .width($(document).width())
      .height($(document).height());
  };

  // Animate the size of the lightbox to fit the image we are showing
  Lightbox.prototype.sizeContainer = function(imageWidth, imageHeight) {
    var self = this;

    var oldWidth  = this.$outerContainer.outerWidth();
    var oldHeight = this.$outerContainer.outerHeight();
    var newWidth  = imageWidth + this.containerPadding.left + this.containerPadding.right + this.imageBorderWidth.left + this.imageBorderWidth.right;
    var newHeight = imageHeight + this.containerPadding.top + this.containerPadding.bottom + this.imageBorderWidth.top + this.imageBorderWidth.bottom;

    function postResize() {
      self.$lightbox.find('.lb-dataContainer').width(newWidth);
      self.$lightbox.find('.lb-prevLink').height(newHeight);
      self.$lightbox.find('.lb-nextLink').height(newHeight);
      self.showImage();
    }

    if (oldWidth !== newWidth || oldHeight !== newHeight) {
      this.$outerContainer.animate({
        width: newWidth,
        height: newHeight
      }, this.options.resizeDuration, 'swing', function() {
        postResize();
      });
    } else {
      postResize();
    }
  };

  // Display the image and its details and begin preload neighboring images.
  Lightbox.prototype.showImage = function() {
    this.$lightbox.find('.lb-loader').stop(true).hide();
    this.$lightbox.find('.lb-image').fadeIn(this.options.imageFadeDuration);

    this.updateNav();
    this.updateDetails();
    this.preloadNeighboringImages();
    this.enableKeyboardNav();
  };

  // Display previous and next navigation if appropriate.
  Lightbox.prototype.updateNav = function() {
    // Check to see if the browser supports touch events. If so, we take the conservative approach
    // and assume that mouse hover events are not supported and always show prev/next navigation
    // arrows in image sets.
    var alwaysShowNav = false;
    try {
      document.createEvent('TouchEvent');
      alwaysShowNav = (this.options.alwaysShowNavOnTouchDevices) ? true : false;
    } catch (e) {}

    this.$lightbox.find('.lb-nav').show();

    if (this.album.length > 1) {
      if (this.options.wrapAround) {
        if (alwaysShowNav) {
          this.$lightbox.find('.lb-prev, .lb-next').css('opacity', '1');
        }
        this.$lightbox.find('.lb-prev, .lb-next').show();
      } else {
        if (this.currentImageIndex > 0) {
          this.$lightbox.find('.lb-prev').show();
          if (alwaysShowNav) {
            this.$lightbox.find('.lb-prev').css('opacity', '1');
          }
        }
        if (this.currentImageIndex < this.album.length - 1) {
          this.$lightbox.find('.lb-next').show();
          if (alwaysShowNav) {
            this.$lightbox.find('.lb-next').css('opacity', '1');
          }
        }
      }
    }
  };

  // Display caption, image number, and closing button.
  Lightbox.prototype.updateDetails = function() {
    var self = this;

    // Enable anchor clicks in the injected caption html.
    // Thanks Nate Wright for the fix. @https://github.com/NateWr
    if (typeof this.album[this.currentImageIndex].title !== 'undefined' &&
      this.album[this.currentImageIndex].title !== '') {
      var $caption = this.$lightbox.find('.lb-caption');
      if (this.options.sanitizeTitle) {
        $caption.text(this.album[this.currentImageIndex].title);
      } else {
        $caption.html(this.album[this.currentImageIndex].title);
      }
      $caption.fadeIn('fast')
        .find('a').on('click', function(event) {
          if ($(this).attr('target') !== undefined) {
            window.open($(this).attr('href'), $(this).attr('target'));
          } else {
            location.href = $(this).attr('href');
          }
        });
    }

    if (this.album.length > 1 && this.options.showImageNumberLabel) {
      var labelText = this.imageCountLabel(this.currentImageIndex + 1, this.album.length);
      this.$lightbox.find('.lb-number').text(labelText).fadeIn('fast');
    } else {
      this.$lightbox.find('.lb-number').hide();
    }

    this.$outerContainer.removeClass('animating');

    this.$lightbox.find('.lb-dataContainer').fadeIn(this.options.resizeDuration, function() {
      return self.sizeOverlay();
    });
  };

  // Preload previous and next images in set.
  Lightbox.prototype.preloadNeighboringImages = function() {
    if (this.album.length > this.currentImageIndex + 1) {
      var preloadNext = new Image();
      preloadNext.src = this.album[this.currentImageIndex + 1].link;
    }
    if (this.currentImageIndex > 0) {
      var preloadPrev = new Image();
      preloadPrev.src = this.album[this.currentImageIndex - 1].link;
    }
  };

  Lightbox.prototype.enableKeyboardNav = function() {
    $(document).on('keyup.keyboard', $.proxy(this.keyboardAction, this));
  };

  Lightbox.prototype.disableKeyboardNav = function() {
    $(document).off('.keyboard');
  };

  Lightbox.prototype.keyboardAction = function(event) {
    var KEYCODE_ESC        = 27;
    var KEYCODE_LEFTARROW  = 37;
    var KEYCODE_RIGHTARROW = 39;

    var keycode = event.keyCode;
    var key     = String.fromCharCode(keycode).toLowerCase();
    if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
      this.end();
    } else if (key === 'p' || keycode === KEYCODE_LEFTARROW) {
      if (this.currentImageIndex !== 0) {
        this.changeImage(this.currentImageIndex - 1);
      } else if (this.options.wrapAround && this.album.length > 1) {
        this.changeImage(this.album.length - 1);
      }
    } else if (key === 'n' || keycode === KEYCODE_RIGHTARROW) {
      if (this.currentImageIndex !== this.album.length - 1) {
        this.changeImage(this.currentImageIndex + 1);
      } else if (this.options.wrapAround && this.album.length > 1) {
        this.changeImage(0);
      }
    }
  };

  // Closing time. :-(
  Lightbox.prototype.end = function() {
    this.disableKeyboardNav();
    $(window).off('resize', this.sizeOverlay);
    this.$lightbox.fadeOut(this.options.fadeDuration);
    this.$overlay.fadeOut(this.options.fadeDuration);
    $('select, object, embed').css({
      visibility: 'visible'
    });
    if (this.options.disableScrolling) {
      $('body').removeClass('lb-disable-scrolling');
    }
  };

  return new Lightbox();
}));


/*
* MIXITUP - A CSS3 and JQuery Filter & Sort Plugin
* Version: 1.5.5
* License: Creative Commons Attribution-NoDerivs 3.0 Unported - CC BY-ND 3.0
* http://creativecommons.org/licenses/by-nd/3.0/
* This software may be used freely on commercial and non-commercial projects with attribution to the author/copyright holder.
* Author: Patrick Kunka
* Copyright 2012-2013 Patrick Kunka, Barrel LLC, All Rights Reserved
* 
* http://mixitup.io
*/

(function($){
    
    // DECLARE METHODS
 
    var methods = {

        // "INIT" METHOD
    
        init: function(settings){

            return this.each(function(){
                
                var browser = window.navigator.appVersion.match(/Chrome\/(\d+)\./),
                    ver = browser ? parseInt(browser[1], 10) : false,
                    chromeFix = function(id){
                        var grid = document.getElementById(id),
                            parent = grid.parentElement,
                            placeholder = document.createElement('div'),
                            frag = document.createDocumentFragment();

                        parent.insertBefore(placeholder, grid);  
                        frag.appendChild(grid);
                        parent.replaceChild(grid, placeholder);
                        frag = null;
                        placeholder = null;
                    };
                
                if(ver && ver == 31 || ver == 32){
                    chromeFix(this.id);
                };
                
                // BUILD CONFIG OBJECT

                var config = {
                    
                    // PUBLIC PROPERTIES
                    
                    targetSelector : '.mix',
                    filterSelector : '.filter',
                    sortSelector : '.sort',
                    buttonEvent: 'click',
                    effects : ['fade', 'scale'],
                    listEffects : null,
                    easing : 'smooth',
                    layoutMode: 'grid',
                    targetDisplayGrid : 'inline-block',
                    targetDisplayList: 'block',
                    listClass : '',
                    gridClass : '',
                    transitionSpeed : 600,
                    showOnLoad : 'all',
                    sortOnLoad : false,
                    multiFilter : false,
                    filterLogic : 'or',
                    resizeContainer : true,
                    minHeight : 0,
                    failClass : 'fail',
                    perspectiveDistance : '3000',
                    perspectiveOrigin : '50% 50%',
                    animateGridList : true,
                    onMixLoad: null,
                    onMixStart : null,
                    onMixEnd : null,

                    // MISC

                    container : null,
                    origOrder : [],
                    startOrder : [],
                    newOrder : [],
                    origSort: [],
                    checkSort: [],
                    filter : '',
                    mixing : false,
                    origDisplay : '',
                    origLayout: '',
                    origHeight : 0, 
                    newHeight : 0,
                    isTouch : false,
                    resetDelay : 0,
                    failsafe : null,

                    // CSS
                    
                    prefix : '',
                    easingFallback : 'ease-in-out',
                    transition : {}, 
                    perspective : {}, 
                    clean : {},
                    fade : '1',
                    scale : '',
                    rotateX : '',
                    rotateY : '',
                    rotateZ : '',
                    blur : '',
                    grayscale : ''
                };
                
                if(settings){
                    $.extend(config, settings);
                };

                // ADD CONFIG OBJECT TO CONTAINER OBJECT PER INSTANTIATION
                
                this.config = config;
                
                // DETECT TOUCH
                
                $.support.touch = 'ontouchend' in document;

                if ($.support.touch) {
                    config.isTouch = true;
                    config.resetDelay = 350;
                };
                
                // LOCALIZE CONTAINER
    
                config.container = $(this);
                var $cont = config.container;
                
                // GET VENDOR PREFIX
                
                config.prefix = prefix($cont[0]);
                config.prefix = config.prefix ? '-'+config.prefix.toLowerCase()+'-' : '';
                
                // CACHE 'DEFAULT' SORTING ORDER
            
                $cont.find(config.targetSelector).each(function(){
                    config.origOrder.push($(this));
                });
                
                // PERFORM SORT ON LOAD 
                
                if(config.sortOnLoad){
                    var sortby, order;
                    if($.isArray(config.sortOnLoad)){
                        sortby = config.sortOnLoad[0], order = config.sortOnLoad[1];
                        $(config.sortSelector+'[data-sort='+config.sortOnLoad[0]+'][data-order='+config.sortOnLoad[1]+']').addClass('active');
                    } else {
                        $(config.sortSelector+'[data-sort='+config.sortOnLoad+']').addClass('active');
                        sortby = config.sortOnLoad, config.sortOnLoad = 'desc';
                    };
                    sort(sortby, order, $cont, config);
                };
                
                // BUILD TRANSITION AND PERSPECTIVE OBJECTS
                
                for(var i = 0; i<2; i++){
                    var a = i==0 ? a = config.prefix : '';
                    config.transition[a+'transition'] = 'all '+config.transitionSpeed+'ms ease-in-out';
                    config.perspective[a+'perspective'] = config.perspectiveDistance+'px';
                    config.perspective[a+'perspective-origin'] = config.perspectiveOrigin;
                };
                
                // BUILD TRANSITION CLEANER
                
                for(var i = 0; i<2; i++){
                    var a = i==0 ? a = config.prefix : '';
                    config.clean[a+'transition'] = 'none';
                };
    
                // CHOOSE GRID OR LIST
    
                if(config.layoutMode == 'list'){
                    $cont.addClass(config.listClass);
                    config.origDisplay = config.targetDisplayList;
                } else {
                    $cont.addClass(config.gridClass);
                    config.origDisplay = config.targetDisplayGrid;
                };
                config.origLayout = config.layoutMode;
                
                // PARSE 'SHOWONLOAD'
                
                var showOnLoadArray = config.showOnLoad.split(' ');
                
                // GIVE ACTIVE FILTER ACTIVE CLASS
                
                $.each(showOnLoadArray, function(){
                    $(config.filterSelector+'[data-filter="'+this+'"]').addClass('active');
                });
                
                // RENAME "ALL" CATEGORY TO "MIX_ALL"
    
                $cont.find(config.targetSelector).addClass('mix_all');
                if(showOnLoadArray[0]  == 'all'){
                    showOnLoadArray[0] = 'mix_all',
                    config.showOnLoad = 'mix_all';
                };
                
                // FADE IN 'SHOWONLOAD'
                
                var $showOnLoad = $();
                $.each(showOnLoadArray, function(){
                    $showOnLoad = $showOnLoad.add($('.'+this))
                });
                
                $showOnLoad.each(function(){
                    var $t = $(this);
                    if(config.layoutMode == 'list'){
                        $t.css('display',config.targetDisplayList);
                    } else {
                        $t.css('display',config.targetDisplayGrid);
                    };
                    $t.css(config.transition);
                });
                
                // WRAP FADE-IN TO PREVENT RACE CONDITION
                
                var delay = setTimeout(function(){
                    
                    config.mixing = true;
                    
                    $showOnLoad.css('opacity','1');
                    
                    // CLEAN UP
                    
                    var reset = setTimeout(function(){
                        if(config.layoutMode == 'list'){
                            $showOnLoad.removeStyle(config.prefix+'transition, transition').css({
                                display: config.targetDisplayList,
                                opacity: 1
                            });
                        } else {
                            $showOnLoad.removeStyle(config.prefix+'transition, transition').css({
                                display: config.targetDisplayGrid,
                                opacity: 1
                            });
                        };
                        
                        // FIRE "ONMIXLOAD" CALLBACK
                        
                        config.mixing = false;

                        if(typeof config.onMixLoad == 'function') {
                            var output = config.onMixLoad.call(this, config);

                            // UPDATE CONFIG IF DATA RETURNED

                            config = output ? output : config;
                        };
                        
                    },config.transitionSpeed);
                },10);
                
                // PRESET ACTIVE FILTER
                
                config.filter = config.showOnLoad;
            
                // BIND SORT CLICK HANDLERS
            
                $(config.sortSelector).bind(config.buttonEvent,function(){
                    
                    if(!config.mixing){
                        
                        // PARSE SORT ARGUMENTS FROM BUTTON CLASSES
                        
                        var $t = $(this),
                        sortby = $t.attr('data-sort'),
                        order = $t.attr('data-order');
                        
                        if(!$t.hasClass('active')){
                            $(config.sortSelector).removeClass('active');
                            $t.addClass('active');
                        } else {
                            if(sortby != 'random')return false;
                        };
                        
                        $cont.find(config.targetSelector).each(function(){
                            config.startOrder.push($(this));
                        });
                
                        goMix(config.filter,sortby,order,$cont, config);
                
                    };
                
                });

                // BIND FILTER CLICK HANDLERS

                $(config.filterSelector).bind(config.buttonEvent,function(){
                
                    if(!config.mixing){
                        
                        var $t = $(this);
                        
                        // PARSE FILTER ARGUMENTS FROM BUTTON CLASSES
        
                        if(config.multiFilter == false){
                            
                            // SINGLE ACTIVE BUTTON
                            
                            $(config.filterSelector).removeClass('active');
                            $t.addClass('active');
                        
                            config.filter = $t.attr('data-filter');
                        
                            $(config.filterSelector+'[data-filter="'+config.filter+'"]').addClass('active');

                        } else {
                        
                            // MULTIPLE ACTIVE BUTTONS
                            
                            var thisFilter = $t.attr('data-filter'); 
                        
                            if($t.hasClass('active')){
                                $t.removeClass('active');
                                
                                // REMOVE FILTER FROM SPACE-SEPERATED STRING
                                
                                var re = new RegExp('(\\s|^)'+thisFilter);
                                config.filter = config.filter.replace(re,'');
                            } else {
                                
                                // ADD FILTER TO SPACE-SEPERATED STRING
                                
                                $t.addClass('active');
                                config.filter = config.filter+' '+thisFilter;
                                
                            };
                        };
                        
                        // GO MIX
                        
                        goMix(config.filter, null, null, $cont, config);

                    };
                
                });
                    
            });
        },
    
        // "TOGRID" METHOD
    
        toGrid: function(){
            return this.each(function(){
                var config = this.config;
                if(config.layoutMode != 'grid'){
                    config.layoutMode = 'grid';
                    goMix(config.filter, null, null, $(this), config);
                };
            });
        },
    
        // "TOLIST" METHOD
    
        toList: function(){
            return this.each(function(){
                var config = this.config;
                if(config.layoutMode != 'list'){
                    config.layoutMode = 'list';
                    goMix(config.filter, null, null, $(this), config);
                };
            });
        },
    
        // "FILTER" METHOD
    
        filter: function(arg){
            return this.each(function(){
                var config = this.config;
                if(!config.mixing){ 
                    $(config.filterSelector).removeClass('active');
                    $(config.filterSelector+'[data-filter="'+arg+'"]').addClass('active');
                    goMix(arg, null, null, $(this), config);
                };
            }); 
        },
    
        // "SORT" METHOD
    
        sort: function(args){
            return this.each(function(){
                var config = this.config,
                    $t = $(this);
                if(!config.mixing){
                    $(config.sortSelector).removeClass('active');
                    if($.isArray(args)){
                        var sortby = args[0], order = args[1];
                        $(config.sortSelector+'[data-sort="'+args[0]+'"][data-order="'+args[1]+'"]').addClass('active');
                    } else {
                        $(config.sortSelector+'[data-sort="'+args+'"]').addClass('active');
                        var sortby = args, order = 'desc';
                    };
                    $t.find(config.targetSelector).each(function(){
                        config.startOrder.push($(this));
                    });
                    
                    goMix(config.filter,sortby,order, $t, config);
                
                };
            });
        },
        
        // "MULTIMIX" METHOD
        
        multimix: function(args){
            return this.each(function(){
                var config = this.config,
                    $t = $(this);
                    multiOut = {
                        filter: config.filter,
                        sort: null,
                        order: 'desc',
                        layoutMode: config.layoutMode
                    };
                $.extend(multiOut, args);
                if(!config.mixing){
                    $(config.filterSelector).add(config.sortSelector).removeClass('active');
                    $(config.filterSelector+'[data-filter="'+multiOut.filter+'"]').addClass('active');
                    if(typeof multiOut.sort !== 'undefined'){
                        $(config.sortSelector+'[data-sort="'+multiOut.sort+'"][data-order="'+multiOut.order+'"]').addClass('active');
                        $t.find(config.targetSelector).each(function(){
                            config.startOrder.push($(this));
                        });
                    };
                    config.layoutMode = multiOut.layoutMode;
                    goMix(multiOut.filter,multiOut.sort,multiOut.order, $t, config);
                };
            });
        },
        
        // "REMIX" METHOD

        remix: function(arg){
            return this.each(function(){
                var config = this.config,
                    $t = $(this);   
                config.origOrder = [];
                $t.find(config.targetSelector).each(function(){
                    var $th = $(this);
                    $th.addClass('mix_all'); 
                    config.origOrder.push($th);
                });
                if(!config.mixing && typeof arg !== 'undefined'){
                    $(config.filterSelector).removeClass('active');
                    $(config.filterSelector+'[data-filter="'+arg+'"]').addClass('active');
                    goMix(arg, null, null, $t, config);
                };
            });
        }
    };
    
    // DECLARE PLUGIN

    $.fn.mixitup = function(method, arg){
        if (methods[method]) {
            return methods[method].apply( this, Array.prototype.slice.call(arguments,1));
        } else if (typeof method === 'object' || ! method){
            return methods.init.apply( this, arguments );
        };
    };
    
    /* ==== THE MAGIC ==== */
    
    function goMix(filter, sortby, order, $cont, config){
        
        // WE ARE NOW MIXING

        clearInterval(config.failsafe);
        config.mixing = true;   
        
        // APPLY ARGS TO CONFIG
        
        config.filter = filter;
        
        // FIRE "ONMIXSTART" CALLBACK
        
        if(typeof config.onMixStart == 'function') {
            var output = config.onMixStart.call(this, config);
            
            // UPDATE CONFIG IF DATA RETURNED
            
            config = output ? output : config;
        };
        
        // SHORT LOCAL VARS
        
        var speed = config.transitionSpeed;
        
        // REBUILD TRANSITION AND PERSPECTIVE OBJECTS
        
        for(var i = 0; i<2; i++){
            var a = i==0 ? a = config.prefix : '';
            config.transition[a+'transition'] = 'all '+speed+'ms linear';
            config.transition[a+'transform'] = a+'translate3d(0,0,0)';
            config.perspective[a+'perspective'] = config.perspectiveDistance+'px';
            config.perspective[a+'perspective-origin'] = config.perspectiveOrigin;
        };
        
        // CACHE TARGET ELEMENTS FOR QUICK ACCESS
        
        var mixSelector = config.targetSelector,
        $targets = $cont.find(mixSelector);
        
        // ADD DATA OBJECT TO EACH TARGET
        
        $targets.each(function(){
            this.data = {};
        });
        
        // RE-DEFINE CONTAINER INCASE NOT IMMEDIATE PARENT OF TARGET ELEMENTS 
        
        var $par = $targets.parent();
    
        // ADD PERSPECTIVE TO CONTAINER 
        
        $par.css(config.perspective);
        
        // SETUP EASING

        config.easingFallback = 'ease-in-out';
        if(config.easing == 'smooth')config.easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        if(config.easing == 'snap')config.easing = 'cubic-bezier(0.77, 0, 0.175, 1)';
        if(config.easing == 'windback'){
            config.easing = 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
            config.easingFallback = 'cubic-bezier(0.175, 0.885, 0.320, 1)'; // Fall-back for old webkit, with no values > 1 or < 1
        };
        if(config.easing == 'windup'){
            config.easing = 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
            config.easingFallback = 'cubic-bezier(0.6, 0.28, 0.735, 0.045)';
        };
        
        // USE LIST SPECIFIC EFFECTS IF DECLARED
        
        var effectsOut = config.layoutMode == 'list' && config.listEffects != null ? config.listEffects : config.effects;
    
        // BUILD EFFECTS STRINGS & SKIP IF IE8
    
        if (Array.prototype.indexOf){
            config.fade = effectsOut.indexOf('fade') > -1 ? '0' : '';
            config.scale = effectsOut.indexOf('scale') > -1 ? 'scale(.01)' : '';
            config.rotateZ = effectsOut.indexOf('rotateZ') > -1 ? 'rotate(180deg)' : '';
            config.rotateY = effectsOut.indexOf('rotateY') > -1 ? 'rotateY(90deg)' : '';
            config.rotateX = effectsOut.indexOf('rotateX') > -1 ? 'rotateX(90deg)' : '';
            config.blur = effectsOut.indexOf('blur') > -1 ? 'blur(8px)' : '';
            config.grayscale = effectsOut.indexOf('grayscale') > -1 ? 'grayscale(100%)' : '';
        };
        
        // DECLARE NEW JQUERY OBJECTS FOR GROUPING
        
        var $show = $(), 
        $hide = $(),
        filterArray = [],
        multiDimensional = false;
        
        // BUILD FILTER ARRAY(S)
        
        if(typeof filter === 'string'){
            
            // SINGLE DIMENSIONAL FILTERING
            
            filterArray = buildFilterArray(filter);
            
        } else {
            
            // MULTI DIMENSIONAL FILTERING
            
            multiDimensional = true;
            
            $.each(filter,function(i){
                filterArray[i] = buildFilterArray(this);
            });
        };

        // "OR" LOGIC (DEFAULT)
        
        if(config.filterLogic == 'or'){
            
            if(filterArray[0] == '') filterArray.shift(); // IF FIRST ITEM IN ARRAY IS AN EMPTY SPACE, DELETE
            
            // IF NO ELEMENTS ARE DESIRED THEN HIDE ALL VISIBLE ELEMENTS
        
            if(filterArray.length < 1){
                
                $hide = $hide.add($cont.find(mixSelector+':visible'));
                
            } else {

            // ELSE CHECK EACH TARGET ELEMENT FOR ANY FILTER CATEGORY:
            
                $targets.each(function(){
                    var $t = $(this);
                    if(!multiDimensional){
                        // IF HAS ANY FILTER, ADD TO "SHOW" OBJECT
                        if($t.is('.'+filterArray.join(', .'))){
                            $show = $show.add($t);
                        // ELSE IF HAS NO FILTERS, ADD TO "HIDE" OBJECT
                        } else {
                            $hide = $hide.add($t);
                        };
                    } else {
                        
                        var pass = 0;
                        // FOR EACH DIMENSION
                        
                        $.each(filterArray,function(i){
                            if(this.length){
                                if($t.is('.'+this.join(', .'))){
                                    pass++
                                };
                            } else if(pass > 0){
                                pass++;
                            };
                        });
                        // IF PASSES ALL DIMENSIONS, SHOW
                        if(pass == filterArray.length){
                            $show = $show.add($t);
                        // ELSE HIDE
                        } else {
                            $hide = $hide.add($t);
                        };
                    };
                });
            
            };
    
        } else {
            
        // "AND" LOGIC
            
            // ADD "MIX_SHOW" CLASS TO ELEMENTS THAT HAVE ALL FILTERS
            
            $show = $show.add($par.find(mixSelector+'.'+filterArray.join('.')));
            
            // ADD "MIX_HIDE" CLASS TO EVERYTHING ELSE
            
            $hide = $hide.add($par.find(mixSelector+':not(.'+filterArray.join('.')+'):visible'));
        };
        
        // GET TOTAL NUMBER OF ELEMENTS TO SHOW
        
        var total = $show.length;
        
        // DECLARE NEW JQUERY OBJECTS

        var $tohide = $(),
        $toshow = $(),
        $pre = $();
        
        // FOR ELEMENTS TO BE HIDDEN, IF NOT ALREADY HIDDEN THEN ADD TO OBJECTS "TOHIDE" AND "PRE" 
        // TO INDICATE PRE-EXISTING ELEMENTS TO BE HIDDEN
        
        $hide.each(function(){
            var $t = $(this);
            if($t.css('display') != 'none'){
                $tohide = $tohide.add($t);
                $pre = $pre.add($t);
            };
        });
        
        // IF ALL ELEMENTS ARE ALREADY SHOWN AND THERE IS NOTHING TO HIDE, AND NOT PERFORMING A LAYOUT CHANGE OR SORT:
        
        if($show.filter(':visible').length == total && !$tohide.length && !sortby){
            
            if(config.origLayout == config.layoutMode){
                
                // THEN CLEAN UP AND GO HOME

                resetFilter();
                return false;
            } else {
                
                // IF ONLY ONE ITEM AND CHANGING FORM GRID TO LIST, MOST LIKELY POSITION WILL NOT CHANGE SO WE'RE DONE
            
                if($show.length == 1){ 
                    
                    if(config.layoutMode == 'list'){ 
                        $cont.addClass(config.listClass);
                        $cont.removeClass(config.gridClass);
                        $pre.css('display',config.targetDisplayList);
                    } else {
                        $cont.addClass(config.gridClass);
                        $cont.removeClass(config.listClass);
                        $pre.css('display',config.targetDisplayGrid);
                    };
                    
                    // THEN CLEAN UP AND GO HOME

                    resetFilter();
                    return false;
                }
            };
        };
        
        // GET CONTAINER'S STARTING HEIGHT

        config.origHeight = $par.height();
        
        // IF THERE IS SOMETHING TO BE SHOWN:

        if($show.length){
            
            // REMOVE "FAIL CLASS" FROM CONTAINER IF EXISTS
            
            $cont.removeClass(config.failClass);
            
            
            // FOR ELEMENTS TO BE SHOWN, IF NOT ALREADY SHOWN THEN ADD TO OBJECTS "TOSHOW" ELSE ADD CLASS "MIX_PRE"
            // TO INDICATE PRE-EXISTING ELEMENT

            $show.each(function(){ 
                var $t = $(this);
                if($t.css('display') == 'none'){
                    $toshow = $toshow.add($t)
                } else {
                    $pre = $pre.add($t);
                };
            });
    
            // IF NON-ANIMATED LAYOUT MODE TRANSITION:
        
            if((config.origLayout != config.layoutMode) && config.animateGridList == false){ 
            
                // ADD NEW DISPLAY TYPES, CLEAN UP AND GO HOME
                
                if(config.layoutMode == 'list'){ 
                    $cont.addClass(config.listClass);
                    $cont.removeClass(config.gridClass);
                    $pre.css('display',config.targetDisplayList);
                } else {
                    $cont.addClass(config.gridClass);
                    $cont.removeClass(config.listClass);
                    $pre.css('display',config.targetDisplayGrid);
                };
                
                resetFilter();
                return false;
            };
            
            // IF IE, FUCK OFF, AND THEN CLEAN UP AND GO HOME
        
            if(!window.atob){
                resetFilter();
                return false;
            };
            
            // OVERRIDE ANY EXISTING TRANSITION TIMING FOR CALCULATIONS
            
            $targets.css(config.clean);
            
            // FOR EACH PRE-EXISTING ELEMENT, ADD STARTING POSITION TO 'ORIGPOS' ARRAY
            
            $pre.each(function(){
                this.data.origPos = $(this).offset();
            });
    
            // TEMPORARILY SHOW ALL ELEMENTS TO SHOW (THAT ARE NOT ALREADY SHOWN), WITHOUT HIDING ELEMENTS TO HIDE
            // AND ADD/REMOVE GRID AND LIST CLASSES FROM CONTAINER
    
            if(config.layoutMode == 'list'){
                $cont.addClass(config.listClass);
                $cont.removeClass(config.gridClass);
                $toshow.css('display',config.targetDisplayList);
            } else {
                $cont.addClass(config.gridClass);
                $cont.removeClass(config.listClass);
                $toshow.css('display',config.targetDisplayGrid);
            };
            
            // FOR EACH ELEMENT NOW SHOWN, ADD ITS INTERMEDIATE POSITION TO 'SHOWINTERPOS' ARRAY
    
            $toshow.each(function(){
                this.data.showInterPos = $(this).offset();
            });
            
            // FOR EACH ELEMENT TO BE HIDDEN, BUT NOT YET HIDDEN, AND NOW MOVED DUE TO SHOWN ELEMENTS,
            // ADD ITS INTERMEDIATE POSITION TO 'HIDEINTERPOS' ARRAY

            $tohide.each(function(){
                this.data.hideInterPos = $(this).offset();
            });
            
            // FOR EACH PRE-EXISTING ELEMENT, NOW MOVED DUE TO SHOWN ELEMENTS, ADD ITS POSITION TO 'PREINTERPOS' ARRAY
    
            $pre.each(function(){
                this.data.preInterPos = $(this).offset();
            });
            
            // SET DISPLAY PROPERTY OF PRE-EXISTING ELEMENTS INCASE WE ARE CHANGING LAYOUT MODE
    
            if(config.layoutMode == 'list'){
                $pre.css('display',config.targetDisplayList);
            } else {
                $pre.css('display',config.targetDisplayGrid);
            };
            
            // IF A SORT ARGUMENT HAS BEEN SENT, RUN SORT FUNCTION SO OBJECTS WILL MOVE TO THEIR FINAL ORDER
            
            if(sortby){
                sort(sortby, order, $cont, config); 
            };
            
            // IF VISIBLE SORT ORDER IS THE SAME (WHICH WOULD NOT TRIGGER A TRANSITION EVENT)
        
            if(sortby && compareArr(config.origSort, config.checkSort)){
                
                // THEN CLEAN UP AND GO HOME
                resetFilter();
                return false;
            };
            
            // TEMPORARILY HIDE ALL SHOWN ELEMENTS TO HIDE

            $tohide.hide();
            
            // FOR EACH ELEMENT TO SHOW, AND NOW MOVED DUE TO HIDDEN ELEMENTS BEING REMOVED, 
            // ADD ITS POSITION TO 'FINALPOS' ARRAY
            
            $toshow.each(function(i){
                this.data.finalPos = $(this).offset();
            });
            
            // FOR EACH PRE-EXISTING ELEMENT NOW MOVED DUE TO HIDDEN ELEMENTS BEING REMOVED,
            // ADD ITS POSITION TO 'FINALPREPOS' ARRAY
    
            $pre.each(function(){
                this.data.finalPrePos = $(this).offset();
            });
            
            // SINCE WE ARE IN OUT FINAL STATE, GET NEW HEIGHT OF CONTAINER
    
            config.newHeight = $par.height();
            
            // IF A SORT ARGUMENT AS BEEN SENT, RUN SORT FUNCTION 'RESET' TO MOVE ELEMENTS BACK TO THEIR STARTING ORDER
            
            if(sortby){
                sort('reset', null, $cont, config);
            };
            
            // RE-HIDE ALL ELEMENTS TEMPORARILY SHOWN
            
            $toshow.hide();
            
            // SET DISPLAY PROPERTY OF PRE-EXISTING ELEMENTS BACK TO THEIR 
            // ORIGINAL PROPERTY, INCASE WE ARE CHANGING LAYOUT MODE
            
            $pre.css('display',config.origDisplay);
            
            // ADD/REMOVE GRID AND LIST CLASSES FROM CONTAINER
    
            if(config.origDisplay == 'block'){
                $cont.addClass(config.listClass);
                $toshow.css('display', config.targetDisplayList);
            } else {
                $cont.removeClass(config.listClass);
                $toshow.css('display', config.targetDisplayGrid);
            };
            
            // IF WE ARE ANIMATING CONTAINER, RESET IT TO ITS STARTING HEIGHT
        
            if(config.resizeContainer)$par.css('height', config.origHeight+'px');
    
            // ADD TRANSFORMS TO ALL ELEMENTS TO SHOW
            
            var toShowCSS = {};
            
            for(var i = 0; i<2; i++){
                var a = i==0 ? a = config.prefix : '';
                toShowCSS[a+'transform'] = config.scale+' '+config.rotateX+' '+config.rotateY+' '+config.rotateZ;
                toShowCSS[a+'filter'] = config.blur+' '+config.grayscale;
            };
            
            $toshow.css(toShowCSS);
    
            // FOR EACH PRE-EXISTING ELEMENT, SUBTRACT ITS INTERMEDIATE POSITION FROM ITS ORIGINAL POSITION 
            // TO GET ITS STARTING OFFSET
    
            $pre.each(function(){
                var data = this.data,
                $t = $(this);
                
                if ($t.hasClass('mix_tohide')){
                    data.preTX = data.origPos.left - data.hideInterPos.left;
                    data.preTY = data.origPos.top - data.hideInterPos.top;
                } else {
                    data.preTX = data.origPos.left - data.preInterPos.left;
                    data.preTY = data.origPos.top - data.preInterPos.top;
                };
                var preCSS = {};
                for(var i = 0; i<2; i++){
                    var a = i==0 ? a = config.prefix : '';
                    preCSS[a+'transform'] = 'translate('+data.preTX+'px,'+data.preTY+'px)';
                };
                
                $t.css(preCSS); 
            });
            
            // ADD/REMOVE GRID AND LIST CLASSES FROM CONTAINER
    
            if(config.layoutMode == 'list'){
                $cont.addClass(config.listClass);
                $cont.removeClass(config.gridClass);
            } else {
                $cont.addClass(config.gridClass);
                $cont.removeClass(config.listClass);
            };
            
            // WRAP ANIMATION FUNCTIONS IN 10ms TIMEOUT TO PREVENT RACE CONDITION
            
            var delay = setTimeout(function(){
        
                // APPLY TRANSITION TIMING TO CONTAINER, AND BEGIN ANIMATION TO NEW HEIGHT
                
                if(config.resizeContainer){
                    var containerCSS = {};
                    for(var i = 0; i<2; i++){
                        var a = i==0 ? a = config.prefix : '';
                        containerCSS[a+'transition'] = 'all '+speed+'ms ease-in-out';
                        containerCSS['height'] = config.newHeight+'px';
                    };
                    $par.css(containerCSS);
                };
    
                // BEGIN FADING IN/OUT OF ALL ELEMENTS TO SHOW/HIDE
                $tohide.css('opacity',config.fade);
                $toshow.css('opacity',1);
    
                // FOR EACH ELEMENT BEING SHOWN, CALCULATE ITS TRAJECTORY BY SUBTRACTING
                // ITS INTERMEDIATE POSITION FROM ITS FINAL POSITION.
                // ALSO ADD SPEED AND EASING
                
                $toshow.each(function(){
                    var data = this.data;
                    data.tX = data.finalPos.left - data.showInterPos.left;
                    data.tY = data.finalPos.top - data.showInterPos.top;
                    
                    var toShowCSS = {};
                    for(var i = 0; i<2; i++){
                        var a = i==0 ? a = config.prefix : '';
                        toShowCSS[a+'transition-property'] = a+'transform, '+a+'filter, opacity';
                        toShowCSS[a+'transition-timing-function'] = config.easing+', linear, linear';
                        toShowCSS[a+'transition-duration'] = speed+'ms';
                        toShowCSS[a+'transition-delay'] = '0';
                        toShowCSS[a+'transform'] = 'translate('+data.tX+'px,'+data.tY+'px)';
                        toShowCSS[a+'filter'] = 'none';
                    };
                    
                    $(this).css('-webkit-transition', 'all '+speed+'ms '+config.easingFallback).css(toShowCSS);
                });
                
                // FOR EACH PRE-EXISTING ELEMENT, IF IT HAS A FINAL POSITION, CALCULATE 
                // ITS TRAJETORY BY SUBTRACTING ITS INTERMEDIATE POSITION FROM ITS FINAL POSITION.
                // ALSO ADD SPEED AND EASING
                
                $pre.each(function(){
                    var data = this.data
                    data.tX = data.finalPrePos.left != 0 ? data.finalPrePos.left - data.preInterPos.left : 0;
                    data.tY = data.finalPrePos.left != 0 ? data.finalPrePos.top - data.preInterPos.top : 0;
                    
                    var preCSS = {};
                    for(var i = 0; i<2; i++){
                        var a = i==0 ? a = config.prefix : '';
                        preCSS[a+'transition'] = 'all '+speed+'ms '+config.easing;
                        preCSS[a+'transform'] = 'translate('+data.tX+'px,'+data.tY+'px)';
                    };
                    
                    $(this).css('-webkit-transition', 'all '+speed+'ms '+config.easingFallback).css(preCSS);
                });
        
                // BEGIN TRANSFORMS ON ALL ELEMENTS TO BE HIDDEN
                
                var toHideCSS = {};
                for(var i = 0; i<2; i++){
                    var a = i==0 ? a = config.prefix : '';
                    toHideCSS[a+'transition'] = 'all '+speed+'ms '+config.easing+', '+a+'filter '+speed+'ms linear, opacity '+speed+'ms linear';
                    toHideCSS[a+'transform'] = config.scale+' '+config.rotateX+' '+config.rotateY+' '+config.rotateZ;
                    toHideCSS[a+'filter'] = config.blur+' '+config.grayscale;
                    toHideCSS['opacity'] = config.fade;
                };
                
                $tohide.css(toHideCSS);
                
                // ALL ANIMATIONS HAVE NOW BEEN STARTED, NOW LISTEN FOR TRANSITION END:
                
                $par.bind('webkitTransitionEnd transitionend otransitionend oTransitionEnd',function(e){
                    
                    if (e.originalEvent.propertyName.indexOf('transform') > -1 || e.originalEvent.propertyName.indexOf('opacity') > -1){
                        
                        if(mixSelector.indexOf('.') > -1){
                        
                        // IF MIXSELECTOR IS A CLASS NAME
                        
                            if($(e.target).hasClass(mixSelector.replace('.',''))){
                                resetFilter();
                            };
                        
                        } else {
                            
                        // IF MIXSELECTOR IS A TAG
                        
                            if($(e.target).is(mixSelector)){
                                resetFilter();
                            };
                            
                        };
                        
                    };
                }); 
    
            },10);
            
            // LAST RESORT EMERGENCY FAILSAFE
            
            config.failsafe = setTimeout(function(){
                if(config.mixing){
                    resetFilter();
                };
            }, speed + 400);
    
        } else {
            
        // ELSE IF NOTHING TO SHOW, AND EVERYTHING TO BE HIDDEN
        
            // IF WE ARE RESIZING CONTAINER, SET ITS STARTING HEIGHT
    
            if(config.resizeContainer)$par.css('height', config.origHeight+'px');
            
            // IF IE, FUCK OFF, AND THEN GO HOME
            
            if(!window.atob){
                resetFilter();
                return false;
            };
            
            // GROUP ALL ELEMENTS TO HIDE INTO JQUERY OBJECT
            
            $tohide = $hide;
            
            // WRAP ANIMATION FUNCTIONS IN A 10ms DELAY TO PREVENT RACE CONDITION
    
            var delay = setTimeout(function(){
                
                // APPLY PERSPECTIVE TO CONTAINER
    
                $par.css(config.perspective);
                
                // APPLY TRANSITION TIMING TO CONTAINER, AND BEGIN ANIMATION TO NEW HEIGHT
        
                if(config.resizeContainer){
                    var containerCSS = {};
                    for(var i = 0; i<2; i++){
                        var a = i==0 ? a = config.prefix : '';
                        containerCSS[a+'transition'] = 'height '+speed+'ms ease-in-out';
                        containerCSS['height'] = config.minHeight+'px';
                    };
                    $par.css(containerCSS);
                };
    
                // APPLY TRANSITION TIMING TO ALL TARGET ELEMENTS
                
                $targets.css(config.transition);
                
                // GET TOTAL NUMBER OF ELEMENTS TO HIDE
    
                var totalHide = $hide.length;
                
                // IF SOMETHING TO HIDE:
    
                if(totalHide){
                    
                    // BEGIN TRANSFORMS ON ALL ELEMENTS TO BE HIDDEN

                    var toHideCSS = {};
                    for(var i = 0; i<2; i++){
                        var a = i==0 ? a = config.prefix : '';
                        toHideCSS[a+'transform'] = config.scale+' '+config.rotateX+' '+config.rotateY+' '+config.rotateZ;
                        toHideCSS[a+'filter'] = config.blur+' '+config.grayscale;
                        toHideCSS['opacity'] = config.fade;
                    };

                    $tohide.css(toHideCSS);
                    
                    // ALL ANIMATIONS HAVE NOW BEEN STARTED, NOW LISTEN FOR TRANSITION END:

                    $par.bind('webkitTransitionEnd transitionend otransitionend oTransitionEnd',function(e){
                        if (e.originalEvent.propertyName.indexOf('transform') > -1 || e.originalEvent.propertyName.indexOf('opacity') > -1){
                            $cont.addClass(config.failClass);
                            resetFilter();
                        };
                    });
        
                } else {
                    
                // ELSE, WE'RE DONE MIXING
                    
                    config.mixing = false;
                };
    
            }, 10);
        }; 
        
        // CLEAN UP AND RESET FUNCTION

        function resetFilter(){
            
            // UNBIND TRANSITION END EVENTS FROM CONTAINER
            
            $par.unbind('webkitTransitionEnd transitionend otransitionend oTransitionEnd');
            
            // IF A SORT ARGUMENT HAS BEEN SENT, SORT ELEMENTS TO THEIR FINAL ORDER
            
            if(sortby){
                sort(sortby, order, $cont, config);
            };
            
            // EMPTY SORTING ARRAYS
        
            config.startOrder = [], config.newOrder = [], config.origSort = [], config.checkSort = [];
        
            // REMOVE INLINE STYLES FROM ALL TARGET ELEMENTS AND SLAM THE BRAKES ON
            
            $targets.removeStyle(
                config.prefix+'filter, filter, '+config.prefix+'transform, transform, opacity, display'
            ).css(config.clean).removeAttr('data-checksum');
            
            // BECAUSE IE SUCKS
            
            if(!window.atob){
                $targets.css({
                    display: 'none',
                    opacity: '0'
                });
            };
            
            // REMOVE HEIGHT FROM CONTAINER ONLY IF RESIZING
            
            var remH = config.resizeContainer ? 'height' : '';
            
            // REMOVE INLINE STYLES FROM CONTAINER
        
            $par.removeStyle(
                config.prefix+'transition, transition, '+config.prefix+'perspective, perspective, '+config.prefix+'perspective-origin, perspective-origin, '+remH
            );
            
            // ADD FINAL DISPLAY PROPERTIES AND OPACITY TO ALL SHOWN ELEMENTS
            // CACHE CURRENT LAYOUT MODE & SORT FOR NEXT MIX
            
            if(config.layoutMode == 'list'){
                $show.css({display:config.targetDisplayList, opacity:'1'});
                config.origDisplay = config.targetDisplayList;
            } else {
                $show.css({display:config.targetDisplayGrid, opacity:'1'});
                config.origDisplay = config.targetDisplayGrid;
            };
            config.origLayout = config.layoutMode;
                
            var wait = setTimeout(function(){
                
                // LET GO OF THE BRAKES
                
                $targets.removeStyle(config.prefix+'transition, transition');
            
                // WE'RE DONE MIXING
            
                config.mixing = false;
            
                // FIRE "ONMIXEND" CALLBACK
            
                if(typeof config.onMixEnd == 'function') {
                    var output = config.onMixEnd.call(this, config);
                
                    // UPDATE CONFIG IF DATA RETURNED
                
                    config = output ? output : config;
                };
            });
        };
    };
    
    // SORT FUNCTION
    
    function sort(sortby, order, $cont, config){

        // COMPARE BY ATTRIBUTE

        function compare(a,b) {
            var sortAttrA = isNaN(a.attr(sortby) * 1) ? a.attr(sortby).toLowerCase() : a.attr(sortby) * 1,
                sortAttrB = isNaN(b.attr(sortby) * 1) ? b.attr(sortby).toLowerCase() : b.attr(sortby) * 1;
            if (sortAttrA < sortAttrB)
                return -1;
            if (sortAttrA > sortAttrB)
                return 1;
            return 0;
        };
        
        // REBUILD DOM

        function rebuild(element){
            if(order == 'asc'){
                $sortWrapper.prepend(element).prepend(' ');
            } else {
                $sortWrapper.append(element).append(' ');
            };
        };
        
        // RANDOMIZE ARRAY

        function arrayShuffle(oldArray){
            var newArray = oldArray.slice();
            var len = newArray.length;
            var i = len;
            while (i--){
                var p = parseInt(Math.random()*len);
                var t = newArray[i];
                newArray[i] = newArray[p];
                newArray[p] = t;
            };
            return newArray; 
        };
        
        // SORT
        
        $cont.find(config.targetSelector).wrapAll('<div class="mix_sorter"/>');
        
        var $sortWrapper = $cont.find('.mix_sorter');
        
        if(!config.origSort.length){
            $sortWrapper.find(config.targetSelector+':visible').each(function(){
                $(this).wrap('<s/>');
                config.origSort.push($(this).parent().html().replace(/\s+/g, ''));
                $(this).unwrap();
            });
        };
        
        
        
        $sortWrapper.empty();
        
        if(sortby == 'reset'){
            $.each(config.startOrder,function(){
                $sortWrapper.append(this).append(' ');
            });
        } else if(sortby == 'default'){
            $.each(config.origOrder,function(){
                rebuild(this);
            });
        } else if(sortby == 'random'){
            if(!config.newOrder.length){
                config.newOrder = arrayShuffle(config.startOrder);
            };
            $.each(config.newOrder,function(){
                $sortWrapper.append(this).append(' ');
            }); 
        } else if(sortby == 'custom'){
            $.each(order, function(){
                rebuild(this);
            });
        } else { 
            // SORT BY ATTRIBUTE
            
            if(typeof config.origOrder[0].attr(sortby) === 'undefined'){
                console.log('No such attribute found. Terminating');
                return false;
            };
            
            if(!config.newOrder.length){
                $.each(config.origOrder,function(){
                    config.newOrder.push($(this));
                });
                config.newOrder.sort(compare);
            };
            $.each(config.newOrder,function(){
                rebuild(this);
            });
            
        };
        config.checkSort = [];
        $sortWrapper.find(config.targetSelector+':visible').each(function(i){
            var $t = $(this);
            if(i == 0){
                
                // PREVENT COMPARE RETURNING FALSE POSITIVES ON ELEMENTS WITH NO CLASS/ATTRIBUTES
                
                $t.attr('data-checksum','1');
            };
            $t.wrap('<s/>');
            config.checkSort.push($t.parent().html().replace(/\s+/g, ''));
            $t.unwrap();
        });
        
        $cont.find(config.targetSelector).unwrap();
    };
    
    // FIND VENDOR PREFIX

    function prefix(el) {
        var prefixes = ["Webkit", "Moz", "O", "ms"];
        for (var i = 0; i < prefixes.length; i++){
            if (prefixes[i] + "Transition" in el.style){
                return prefixes[i];
            };
        };
        return "transition" in el.style ? "" : false;
    };
    
    // REMOVE SPECIFIC STYLES
    
    $.fn.removeStyle = function(style){
        return this.each(function(){
            var obj = $(this);
            style = style.replace(/\s+/g, '');
            var styles = style.split(',');
            $.each(styles,function(){
                
                var search = new RegExp(this.toString() + '[^;]+;?', 'g');
                obj.attr('style', function(i, style){
                    if(style) return style.replace(search, '');
                });
            });
        });
    };

    // COMPARE ARRAYS 
    
    function compareArr(a,b){
        if (a.length != b.length) return false;
        for (var i = 0; i < b.length; i++){
            if (a[i].compare) { 
                if (!a[i].compare(b[i])) return false;
            };
            if (a[i] !== b[i]) return false;
        };
        return true;
    };
    
    // BUILD FILTER ARRAY(S)
    
    function buildFilterArray(str){
        // CLEAN FILTER STRING
        str = str.replace(/\s{2,}/g, ' ');
        // FOR EACH PEROID SEPERATED CLASS NAME, ADD STRING TO FILTER ARRAY
        var arr = str.split(' ');
        // IF ALL, REPLACE WITH MIX_ALL
        $.each(arr,function(i){
            if(this == 'all')arr[i] = 'mix_all';
        });
        if(arr[0] == "")arr.shift(); 
        return arr;
    };

    
})(jQuery);
