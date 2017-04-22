# Introduction

There are many advices and framework allowing to arrange complex layering of views. But most of them takes for granted that views should be rendered each time changes arrise on models.

Backbone.NestingView aims to offer simple ways to structure your application into multiple layer of views, track and add views as collection get updated, yet let you control when views are re-rendered.

It can be a very nice fit with the brilliant [Backbone.StickIt](https://github.com/NYTimes/backbone.stickit) plugin, which allows to finely update your DOM as changes are notified, without the need to rely on complete re-rendering of your views.

# Usage

## Nesting views

```javascript
var ChildViewA = Backbone.NestingView.extend({
    template: function(model_json) {
        return model_json.firstName;
    }
});

var ChildViewB = Backbone.NestingView.extend({
    template: function(model_json) {
        return model_json.lastName;
    }
});

var MotherView = Backbone.NestingView.extend({
    template: function() {
        return "<div><span/><p/></div>"
    },
    nestedViews: {
        'span' : ChildViewA,
        'p' : ChildViewB
    }
});

var view = new View({
    model: new Backbone.Model({firstName: 'john', lastName: 'doe'})
});
view.render();
```

The ```view``` will contain the following HTML :
```html
<div>
    <span>john</span>
    <p>doe</p>
</div>
```

## Nesting views (short form)

The same result can be achieved with the following code :

```javascript
var MotherView = Backbone.NestingView.extend({
    template: function() {
        return "<div><span/><p/></div>"
    },
    nestedViews: {
        'span' : {
            template: function(model_json) {
                return model_json.firstName;
            }
        },
        'p' : {
            template: function(model_json) {
                return model_json.lastName;
            }
        }
    }
});
```

## Item views (one view for each model of a collection)

```javascript
var ChildItemView = Backbone.NestingView.extend({
    template: function(model_json) {
        return model_json.title;
    }
});

var MotherView = Backbone.NestingView.extend({
    template: function() {
        return "<ul><li></li></ul>"
    },
    itemViews: {
        'ul' : ChildItemView
    }
});

var collection = new Backbone.Collection([{
    id: "hello",
    title: "Hello !"
}, {
    id: "world",
    title: "World !"
}]);

var view = new View({collection: collection});
view.render();
```

The ```view``` will contain the following HTML :
```html
<ul>
    <li>Hello !</li>
    <li>World !</li>
</ul>
```

Then, if the given code is executed : 

```javascript
collection.add({id: "yeah", title: "Yeah !"}, {at: 1});
```

The ```view``` content will be updated the following HTML :
```html
<ul>
    <li>Hello !</li>
    <li>Yeah !</li>
    <li>World !</li>
</ul>
```

## Item views, short form

```javascript
var MotherView = Backbone.NestingView.extend({
    template: function() {
        return "<ul><li></li></ul>"
    },
    itemViews: {
        'ul' : {
            template: function(model_json) {
                return model_json.title;
            }
        }
    }
});
```

# API

Backbone.NestedView is a subclass of Backbone.

## Scaffolding

Backbone.NestedView offers some scaffolding and default behaviors out of the box, independent of its nesting capabilities.

1. Each of its options given to its constructor is set as a field of a view (not only tagName, className and so on).
2. Its method ```$``` accept a virtual selector : passing to it ```':el``` returns a ```$el``` 
3. The option ```templateEl``` allows the view to clone a given node and use it as its own element
4. The render method calls a set of placeHolders, allowing you to easily override part of its rendering pipeline

### Template Element

When the view is created, if its option contain ```templateEl```, it is passed into the jQuery method and then cloned. This allows templateEl to be either

1. A jQuery element to clone
2. Some HTML code to use

The result of that operation is used as the current element of the view, just as if it was passed as the ```el``` option.

### Rendering

Render has now a default implementation, which does the following :
1. Removing child view
2. Calling ```cleanup``` place holder method
3. Rendering the template
    1. Gets the template through the ```getTemplate``` place holder method (if none is found, then the next 3 points are skipped)
    2. Gets the template data through the ```getTemplateData``` place holder method
    4. Sets the resulting HTML as the content of the current element
4. Calling ```decorate``` place holder method
5. Rendering child views

This allows 4 methods easy to redefined :
* ```decorate``` : Intended to be overriden with post-rendering operations, such as ma,manual DOM alterations, invocations of jQuery UI plugins, pluging databinding behaviors and so on. By default, it does nothing.
* ```cleanup``` : Opposite of ```decorate```, it's objective is to undo anything that was done in ```decorate``` in a graceful way, to avoid memory leakage and dangling event listeners.
* ```getTemplate``` : Find the template of the current view. A template is a function that receives some date to display and return HTML. By default, it simply return ```this.template```. 
* ```getTemplateData``` : Must return the data to be forwarded to the template for displaying. By default, it returns ```model.toJSON()``` if that method exist, or ```model``` otherwise.

Also, should you have any application-wide behavior (such as calling ```stickit``` method in decorate), feel free to assign ```exports.NestingView.prototype.PLACE_HOLDER```.

### Removal

When the ```remove``` method of a NestingView is called, it first remove all child views, as well as call the ```cleanup``` method, before actually removing itself.

Additionally, its behavior regarding ```$el``` is slightly altered in regards to Backbone vanilla :
* The element is removed from the DOM only if it was created by the view (in contrast to being forward to it through ```el```) either trough Backbone default element creation mechanism or through the ```templateEl``` option. 
* If it was not, but a template is found in the view, then it is emptied instead
* Otherwise, the DOM element is left as it is

## Nested View specifications

When a NestingView is rendered, it can create any number of nested view, and then render them within its own.

Those child views are specified through two fields than can be assigned within the view declaration, as well as within its options :
* ```nestedViews``` : contain configurations for simple, unique child view
* ```itemViews``` : contain configurations for child views which are to be repeated for each element of a collection.

Each of those field must contain a hash, where the key is a selector that must point to where the nestedView is to be attached, and its value is a configuration hash.

### Configuration hash

#### Options

By default, any field in the configuration hash is passed as options into child views, except ```view```, ```dynamicOptions``` and (for ```itemViews```) ```templateEl```.

#### ```view```

The view class to be instanciated. If not specified, it is a NestingView class.

#### ```dynamicOptions```

A function invoked when the nested view is instanciated. The current NestingView would be passed both as a unique parameter and as a context of that call. The function is expected to return a hash, which would be merged with the other options.

#### ```model``` and ```collection```

Both the ```model``` and ```collection``` fields can be
* a model/collection objection : it would be taken as it is, and used as options.
* a function : it would be called, expecting it would return a model or collection (the call would pass the NestingView both as unique parameter and as context).
* a string : in that case it would be read as a field of the NestingView, and interpreted either as a model/collection or a function returning one.
* undefined : in that case, the model/collection of the NestingView is reused

#### Simplified forms

If the configuration hash is a class, it is interpreted as if it were instead : 
```javascript
{ view: configurationHash }
```

### Nested Views

Each nested view is instanciated once when the NestingView is rendered. Along with the options defined in the configuration, the nested view also receive, as a ```el``` parameter, the DOM element that was specified as the selector. Therefore, nested views does not need any node specification (no tagName, className and so on).

#### Defining content for nested views

There is two main ways to define the content of nested views :
* Define, within the nested view, a template. Within the template of the parent view, add a "host" node, and attach the nested view on it. The nested view will render its own template within the template of the parent. If remove is called on it, it will empty again that node.
* Include, within the template of the parent NestingView, the actual content of the nested view, and have no template for the nested view. This means that its content will be rendered as part of the template of the parent view, and that the child view will then be simply attached on it. If remove is called on the nested view, the node will not be emptied.

### Item Views

Each item views is instanciated once per model of the listened collection when the NestingView is rendered. Then, each time the collection triggers an ```update``` (added or removed model), ```sort```, or ```reset``` even, new views are invoked and rendered, others are kept, and others are removed. They are also all detached and attached again in the right order.

For item views, the selector that is specified should point to a DOM element that will host, as a parent, the DOM elements of the various views that will be created. That host is called the "container" node.

Therefore, nested views can posess node specifications (tagName, className and so on).

#### Collection

The ```collection``` from the configuration options is used to specify which collection is to be tracked. It is interpreted, and then removed from the options (child item views do not receive within their options the collection they are issued from).

Collections can also be arrays, but in that case, refreshing the view can only be obtained by re-rendering the whole NestingView.

#### ```templateEl```

A selector that would be used, within the the container, to find a node that will be used as a template for all item views.

That node will be detached, and passed as a ```templateEl``` option to each child views.

If not specified, it is ```:last```.

#### ```el```

If specified and if it is a function, it is invoked when the item view is instanciated. The model for which the item view is created is passed both as a unique parameter and as a context of that call. 

This function is expected to return a selector, which would be used to find, within the container node, the element to use for that specific item view.

This option is rarely used, but can help to have dynamic views (nested views or item views) attach themselves on pre-rendered template. When it is specified, all DOM manipulations are disabled.

#### Defining content for item views

There is four ways to define the content of nested views :
* Define, within the item view, node specifications and/or template. Those view will be rendered as expected and appended within the container node. If remove is called, those nodes will be removed.
* Add, within the container, a template node (usually as the last node, but this can be overriden through ```templateEl```) with no content. Define, within the item view, no node specification, but define a template. It will have similar result than the previous option, but the root node of the item view is defined within the template instead of within javascript. The nested view will render its own template to fill its content. If remove is called on it, it will remove that node. This is mostly similar to the first option for nested views.
* Add, within the container, a template node (usually as the last node, but this can be overriden through ```templateEl```) with its content. Define no template nor node specifications within the item view. The template will be cloned as a whole, with its content, and the item view will be attached on it. If remove is called on it, it will remove that node. This is mostly similar to the second option for nested views.
* Include, within the container, static nodes for each child item of your collection. Use the ```el``` option to make sure the right model is bound to the right DOM node through the item view. This is mostly use when your list of elements is static, but you want to work with them through collection.

### Events

All events of child views (both ```nestedViews``` and ```itemViews```) are forwarded to its parent view.