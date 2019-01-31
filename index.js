/**
 * @name Transport
 * @desc Move elements to other containers with matching media queries.
 * @author Renato de Leão, Whitesmith
 * @original Nate Hunzaker, Viget Labs
 */

(function () {
  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

export default class Transport {
  static config = {
    transportMode: "append",
    breakpoints: {
      null: null
    }
  };

  constructor(el, config) {
    this.$el = el

    // defaults for a single element
    this.$contents = this.$el;
    this.$home = this.$el.parentElement;

    // or transport the contents of this element
    /* this should be optional becaus is misleading*/
    /*
    if (this.$el.children.length) {
      this.$contents = this.$el.children;
      this.$home = this.$el;
    }
    */
    this.config = {...Transport.config, ...config};
    this.queries = this.getQueries();


    this.init()
  }

  // breakpoints allow for cleaner markup, for example:
  // <img src="..." data-transport="tablet!#container-id" />
  ship = (destination) => {
      //console.log('ship')
      //console.log(destination)
      var $destination = typeof(destination) === "string" ? document.querySelector(`[data-transport-container="${destination.replace("#","")}"]`) : destination;
      //console.log($destination)
      // Send a warning if the tub selected doesn't match, this will
      // happen if the selector picked doesn't exist
      if ($destination === null || $destination === undefined) {
        console.warn("Transport location was not found:", destination);
      }
      //console.log(this.$el)
      if (!$destination.contains(this.$el)) {
        //this.$contents.appendTo(destination);c

        //console.dir(this.$contents)
        if(this.config.transportMode === "append"){
          $destination.appendChild(this.$contents)
          //$destination.insertAdjancentHTML('beforeend', this.$contents.outerHTML)
        } else {
          // Prepend it
          $destination.insertBefore(this.$contents, $destination.firstElementChild);
        }
        var transportEvent = new CustomEvent('transport', {destination: $destination})
        this.$el.dispatchEvent(transportEvent);
      }
    }

    check = () => {
      var destination = this.$home;
      var queries = this.queries;
      var len = queries.length;

      // reverse array
      for (var i = 0; i < len; i++) {
        var rule = queries[i].rule

        if (window.matchMedia(queries[i].rule).matches) {
          destination = queries[i].element;
        } else {
          destination = queries[0].element;
        }
      }

      this.ship(destination);
    }

    getQueries = () => {
      let elRules = this.$el.getAttribute("data-transport").split('|') || "";
      let breakpoints = this.config.breakpoints;
      let separator = "@";
      // first rule is mobile first and it will always be currentPosition of element
      let _rules = [{rule: "null", element: this.$el.parentElement}]
      elRules.map(rule => {
        var parts = rule.split(separator);
        var query = parts[0];
        var tube = parts[1];

        query = breakpoints[query] || query;

        _rules.push({ rule: query, element: tube })
      });

      //console.log(_rules);
      return _rules;
    }


    resizeHandler = () => {
      clearTimeout(Transport.timeout);

      Transport.timeout = setTimeout(function() {
        window.dispatchEvent(new CustomEvent("resize:transport"));
      }, 250);
    }

    // Boot

    init = () => {
      // Scroll spy
      this.check();
      window.addEventListener("resize:transport", this.check);
      window.addEventListener("resize", this.resizeHandler)
    }
}
