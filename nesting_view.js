(function(factory) {

  // Set up NestingView appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'backbone', 'exports'], function(_, $, Backbone, exports) {
      factory(_, $, Backbone, exports);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var $;
    try { $ = require('jquery'); } catch (e) {}
    factory(
        require('underscore'),
        $,
        require('backbone'),
        exports);

  // Finally, as a browser global.
  } else {
    factory(_, (jQuery || Zepto || ender || $), Backbone, {});
  }

})(function(_, $, Backbone, exports) {
    exports.NestingView = Backbone.NestingView = Backbone.View.extend({
        constructor: function (options) {
            _.extend(this, options);
            this.isElOwned = !this.el;

            if (this.templateEl) {
                this.el = $(this.templateEl).clone();
                delete this.templateEl;
            }
            
            this.childViews = [];
            exports.NestingView.__super__.constructor.apply(this, arguments);
        },

        // Enriched version of $ with custom keyword support
        $: function(selector) {
            switch(selector) {
                case ':el':
                    return this.$el;
                default:
                    return this.$el.find(selector);
            }
        },

        // Override to specify how the view displays a model
        //template: function(model_json) { }},

        // Override to specify how to interpret the "template" field
        getTemplate: function() {
            return this.template;
        },

        // Override to specify what data to send to the template
        getTemplateData: function() {
            if (!this.model)
                return;
            
            return this.model.toJSON
                ? this.model.toJSON()
                : this.model;
        },

        // Override to enrich the dom after it is displayed, or bind to some events
        // Called after the main content of the view is ready, but before child
        // views are rendered
        decorate: function() {
        },

        // Override to cleanup what decorate has done, if necessary
        // Called before rendering and before removing
        cleanup: function() {
        },

        // Can be overriden.
        render: function() {
            this._removeChildViews();
            this.cleanup();

            this.renderTemplate();
            this.decorate();

            this._renderChildViews();

            return this;
        },

        // Clean everything, then render main and child content.
        remove: function() {
            this._removeChildViews();
            this.cleanup();
            Backbone.View.prototype.remove.apply(this, arguments);
        },
        
        _removeElement: function() {
            if (this.isElOwned)
                this.$el.remove();
            else if (this.getTemplate())
                this.$el.empty();
        },

        // Usually, overriding template is enough
        // Can be overriden for custom HTML generation
        renderTemplate: function() {
            var template = this.getTemplate();
            if (!template)
                return;

            this.$el.html(template(this.getTemplateData()));
        },

        // Renders every child views, and record the resulting view wrappers
        _renderChildViews: function() {
            this.childViews = this._renderConfigurations(this.nestedViews, NestedViewManager)
                .concat(this._renderConfigurations(this.itemViews, CollectionViewsManager));
        },

        // Request each view wrapper to remove itself
        _removeChildViews: function() {
            _.each(this.childViews, function(view) {
                view.remove();
            });
        },

        // For each configuration entry, we create a manager of the given type
        _renderConfigurations: function(configurations, ViewManagerType) {
            if (!configurations)
                return [];

            return _.map(configurations, (configuration, selector) => {
                return new ViewManagerType(this, configuration, selector).render();
            });
        }
    });



    // Internal wrapper to manage the view we create.
    // Common behaviour between nested views and collection views
    function BaseViewManager(parentView, configuration, selector) {
        // Expand abreviated format
        if (configuration.prototype) {
            configuration = {view: configuration}
        } 
        
        this.parentView = parentView;
        this.$el = parentView.$(selector);     
        if (!this._hasEl()) 
            console.error("Couldn't find " + selector);

        this.viewClass = configuration.view || exports.NestingView;    
        this.viewOptions = _.clone(configuration, ['view', 'dynamicOptions']);    
        this.dynamicOptions = configuration.dynamicOptions;
        
        // model and collection can be function (applied on the parent view)
        // or string (interpreted as keys from the parent view).
        // By default, they are "model" and "collection" respectively.
        var _this = this;
        function resolve_reference_attribute(name) {
            var fetcher = configuration[name] || name;
            var value = _.isFunction(fetcher)
                ? fetcher.call(parentView, parentView)
                : parentView[fetcher];

            _this.viewOptions[name] = value;
        }
        resolve_reference_attribute('model');
        resolve_reference_attribute('collection');

        this.internalViews = [];
    }

    _.extend(BaseViewManager.prototype, {
        render: function() {        
            if (this._hasEl()) {
                this._render();
            }

            return this;
        },

        // We can render everything provided we either have an element
        _hasEl: function() {
            return this.$el.length
        },

        // Overriden in child implementations
        _render: null,

        _computeOptions: function(options) {
            var dynamicOptions = this.dynamicOptions
                ? this.dynamicOptions.call(this.parentView, this.parentView, options.model)
                : {};                
            
            return _.defaults(options, dynamicOptions, this.viewOptions);
        },

        _renderNewView: function(options) {
            var view = new this.viewClass(options);
            view.render();

            this.parentView.listenTo(view, 'all', this.parentView.trigger);
            this.internalViews.push(view);

            return view;
        },

        remove: function() {
            _.each(this.internalViews, function (view) {
                view.remove();
            });
        }
    });

    BaseViewManager.extend = Backbone.View.extend;



    // Behaviour specific to single views
    function NestedViewManager(parentView, configuration, selector) {
        NestedViewManager.__super__.constructor.call(this, parentView, configuration, selector);
    };

    NestedViewManager = BaseViewManager.extend({
        constructor: NestedViewManager,

        _render: function() {
            this._renderNewView(this._computeOptions({el: this.$el}));
        },
    });



    // Behaviour specific to tracking collection, and creating an Item View for each item
    function CollectionViewsManager(parentView, configuration, selector) {
        CollectionViewsManager.__super__.constructor.call(this, parentView, configuration, selector);
    
        this.modelViews = {};
        this.nonModelViews = [];
        
        this.collection = this.viewOptions.collection;
        delete this.viewOptions.collection;

        this.areChildNodesPreRendered = configuration.el;
        if (!this.areChildNodesPreRendered) {
            this.$templateEl = this.$el.find(this.viewOptions.templateEl || ':last')
                .detach();
        }

        this.listenTo(this.collection, 'sort reset', this.render);
        this.listenTo(this.collection, 'update', this._onUpdate);
        this._render();
    };

    CollectionViewsManager = BaseViewManager.extend({
        constructor: CollectionViewsManager,

        _onUpdate: function(collection, options) {
            if (options.changes.added.length
                || options.changes.removed.length)
                this.render();
        },

        _render: function() {
            if (!this.collection)
                return;
            
            this._removeNonModelViews();

            var iterable = _.isArray(this.collection)
                ? _(this.collection)
                : this.collection;
            
            // Can't use pluck because cid is not an attribute but a member.
            var existingCids = iterable.map(_.property('cid')); 
            this._removeMissingModelViews(existingCids);

            iterable.each(this._refreshViewOf, this);
        },

        _refreshViewOf: function(model) {
            var itemView = model.cid 
                && this.modelViews[model.cid];

            if (!itemView)
                this._createView(model);       
            else
                this._reappendView(itemView);
        },

        _createView: function(model) {
            var options = this._computeOptions({
                model: model,
                templateEl: this.$templateEl && this.$templateEl.length === 1
                    ? this.$templateEl
                    : null
            });

            if (options.el && _.isFunction(options.el)) {
                var selector = options.el.call(options.model, options.model);
                options.el = this.$el.find(selector);
            }

            var view = this._renderNewView(options);
            this._appendView(view);
            
            if (model.cid)
                this.modelViews[model.cid] = view;
            else
                this.nonModelViews.push(view);
        },

        _appendView: function(view) {
            if (!this.areChildNodesPreRendered)
                this.$el.append(view.$el);
        },

        _reappendView: function(itemView) {            
            if (!this.areChildNodesPreRendered) {
                itemView.$el.detach();
                this.$el.append(itemView.$el);
            }
        },

        _removeMissingModelViews: function(existingCids) {
            var removeCids = _.difference(_.keys(this.modelViews), existingCids);
            
            _.each(removeCids, function(removedCid) {
                this.modelViews[removedCid].remove();
                delete this.modelViews[removedCid];
            }, this);
        },

        _removeNonModelViews: function() {
            _.each(this.nonModelViews, function(view) {
                view.remove();
            });
            this.nonModelViews = [];
        }
    });

    _.extend(CollectionViewsManager.prototype, Backbone.Events);

    return exports.NestingView;
});
