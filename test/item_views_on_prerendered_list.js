const _ = require('underscore');
const chai = require('chai');
const Backbone = require('backbone');

const NestingView = require('../nesting_view').NestingView;

describe('for multiple element on prerendered list', () => {

    const createCollection = function() {
        return new Backbone.Collection([{
            id: "hello",
            title: "Hello !"
        }, {
            id: "world",
            title: "World !"
        }]);
    }
    
    it('attach new item views in requested container', () => {
        const View = NestingView.extend({
            template: _ => '<ul><li class="hello"/><li class="world"/></ul>',
            itemViews : {
                'ul' : {
                    el: model => '.' + model.id,
                    template: json => json.title
                }
            }
        });

        const view = new View({
            collection : createCollection()
        });
        view.render();

        chai.expect(view.$el.html()).to.be.equal(
            '<ul><li class="hello">Hello !</li><li class="world">World !</li></ul>');
    });
    
    it('remove child views when removed', () => {
        const View = NestingView.extend({
            template: _ => '<ul><li class="hello"/><li class="world"/></ul>',
            itemViews : {
                'ul' : {
                    el: model => '.' + model.id,
                    template: json => json.title
                }
            }
        });
        
        const view = new View({
            collection : createCollection()
        });
        view.render();
        view.remove();

        chai.expect(view.$el.html()).to.be.equal('<ul><li class="hello"></li><li class="world"></li></ul>');
    });

    it('listen to collection and attach new items', () => {
        const View = NestingView.extend({
            template: _ => '<ul><li class="hello"/><li class="yeah"/><li class="world"/></ul>',
            itemViews : {
                'ul' : {
                    el: model => '.' + model.id,
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();
        
        collection.add({id: "yeah", title: "Yeah !"});

        chai.expect(view.$el.html()).to.be.equal('<ul>'
            + '<li class="hello">Hello !</li>' 
            + '<li class="yeah">Yeah !</li>'
            + '<li class="world">World !</li>'
            + '</ul>');
    });

    it("don't do anything when silent", () => {
        const View = NestingView.extend({
            template: _ => '<ul><li class="hello"/><li class="yeah"/><li class="world"/></ul>',
            itemViews : {
                'ul' : {
                    el: model => '.' + model.id,
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();
        
        collection.add({id: "yeah", title: "Yeah !"}, {silent: true});

        chai.expect(view.$el.html()).to.be.equal('<ul>'
            + '<li class="hello">Hello !</li>' 
            + '<li class="yeah"></li>'
            + '<li class="world">World !</li>'
            + '</ul>');
    });

    it("support reset", () => {
        const View = NestingView.extend({
            template: _ => '<ul><li class="hello"/><li class="yeah"/><li class="world"/></ul>',
            itemViews : {
                'ul' : {
                    el: model => '.' + model.id,
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();

        collection.reset([
            {id: "yeah", title: "Anybody there ?"},
            {id: "hello", title: "Hello ?"},
            {id: "world", title: "World ! You there ?!"}
        ]);

        chai.expect(view.$el.html()).to.be.equal('<ul>'
            + '<li class="hello">Hello ?</li>' 
            + '<li class="yeah">Anybody there ?</li>'
            + '<li class="world">World ! You there ?!</li>'
            + '</ul>');
    });
});
