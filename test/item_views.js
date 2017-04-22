const _ = require('underscore');
const chai = require('chai');
const Backbone = require('backbone');

const NestingView = require('../nesting_view').NestingView;

describe('for multiple element', () => {

    const createCollection = function() {
        return new Backbone.Collection([{
            title: "hello"
        }, {
            title: "world"
        }]);
    }
    
    it('create item views in requested container', () => {
        const View = NestingView.extend({
            template: _ => "<ul></ul>",
            itemViews : {
                'ul' : NestingView.extend({
                    tagName: "li",
                    template: json => json.title
                })
            }
        });

        const view = new View({
            collection : createCollection()
        });
        view.render();

        chai.expect(view.$el.html()).to.be.equal("<ul><li>hello</li><li>world</li></ul>");
    });
    
    it('reuse specified template for item views', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    view: NestingView.extend({
                        template: json => json.title
                    }),
                    templateEl: ':last'
                }                    
            }
        });

        const view = new View({
            collection : createCollection()
        });
        view.render();

        chai.expect(view.$el.html()).to.be.equal("<ul><li>hello</li><li>world</li></ul>");
    });
    
    it('by default, the template is the last node', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : NestingView.extend({
                    template: json => json.title
                })
            }
        });

        const view = new View({
            collection : createCollection()
        });
        view.render();

        chai.expect(view.$el.html()).to.be.equal("<ul><li>hello</li><li>world</li></ul>");
    });
    
    it('accepts simple array', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li/></ul>",
            itemViews : {
                'ul' : NestingView.extend({
                    template: json => json.title
                })
            }
        });

        const view = new View({
            collection : createCollection().models
        });
        view.render();

        chai.expect(view.$el.html()).to.be.equal("<ul><li>hello</li><li>world</li></ul>");
    });

    it('uses given collection', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li/></ul>",
            itemViews : {
                'ul' : {
                    view: NestingView.extend({
                        template: json => json.title
                    }),
                    collection: 'customCollection'
                }
            }
        });

        const view = new View();
        view.customCollection = createCollection();
        view.render();

        chai.expect(view.$el.html()).to.be.equal("<ul><li>hello</li><li>world</li></ul>");
    });


    it('uses other options as view options', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    view: NestingView,
                    template: json => json.title,
                    collection: 'customCollection'
                }
            }
        });

        const view = new View({
            customCollection: createCollection()
        });
        view.render();

        chai.expect(view.$el.html()).to.be.equal("<ul><li>hello</li><li>world</li></ul>");
    });

    it('defaults to NestingView', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li/></ul>",
            itemViews : {
                'ul' : {
                    template: json => json.title
                }
            }
        });

        const view = new View({
            collection: createCollection()
        });
        view.render();

        chai.expect(view.$el.html()).to.be.equal("<ul><li>hello</li><li>world</li></ul>");
    });

    it('registers views', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : NestingView.extend({
                    template: json => json.title
                })
            }
        });

        const view = new View({
            collection : createCollection()
        });
        view.render();

        chai.expect(view.childViews).to.have.lengthOf(1);
        chai.expect(_.keys(view.childViews[0].modelViews)).to.have.lengthOf(2);
        chai.expect(_.values(view.childViews[0].modelViews)[0].$el.html()).to.be.equal("hello");
        chai.expect(_.values(view.childViews[0].modelViews)[1].$el.html()).to.be.equal("world");
    });

    it('remove child views when removed', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    template: json => json.title
                }
            }
        });
        
        const view = new View({
            collection : createCollection()
        });
        view.render();
        view.remove();

        chai.expect(view.$el.html()).to.be.equal("<ul></ul>");
    });

    it('listen to collection and add new items', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();
        
        collection.add({title: "yeah"});

        chai.expect(view.$el.html()).to.be.equal(
            "<ul><li>hello</li><li>world</li><li>yeah</li></ul>");
    });
    it('add items in correct position', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();
        
        collection.add({title: "yeah"}, {at: 1});
        chai.expect(view.$el.html()).to.be.equal(
            "<ul><li>hello</li><li>yeah</li><li>world</li></ul>");
    });

    it('removes removed items', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();
        
        collection.remove(collection.at(0));
        chai.expect(view.$el.html()).to.be.equal(
            "<ul><li>world</li></ul>");
    });

    it("don't do anything when silent", () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();
        
        collection.remove(collection.at(0), {silent: true});
        chai.expect(view.$el.html()).to.be.equal(
            "<ul><li>hello</li><li>world</li></ul>");
    });

    it("support reset", () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
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
            {title: "yo"},
            collection.at(1),
            {title: "!!"}
        ])

        chai.expect(view.$el.html()).to.be.equal(
            "<ul><li>yo</li><li>world</li><li>!!</li></ul>");
    });

    it("even with reset, keeps the same view when possible", () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();
        
        const previousWordView = view.childViews[0].modelViews[collection.at(1).cid];
        collection.reset([
            {title: "yo"},
            collection.at(1),
            {title: "!!"}
        ])

        const newWordView = view.childViews[0].modelViews[collection.at(1).cid];
        chai.expect(previousWordView).to.be.equal(newWordView);
    });

    it("track sorting", () => {
        const View = NestingView.extend({
            template: _ => "<ul><li></li></ul>",
            itemViews : {
                'ul' : {
                    template: json => json.title
                }
            }
        });

        const collection = createCollection();
        const view = new View({
            collection : collection
        });
        view.render();
        
        const previousWordView = view.childViews[0].modelViews[collection.at(1).cid];

        collection.comparator = model => model.get('title')[4];
        collection.sort();

        chai.expect(view.$el.html()).to.be.equal(
            "<ul><li>world</li><li>hello</li></ul>");
    });
});
