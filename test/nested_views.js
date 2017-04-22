const chai = require('chai');
const sinon = require('sinon');
const Backbone = require('backbone');

const NestingView = require('../nesting_view').NestingView;

describe('for nested views', () => {
    it("attach given view on given node", () => {
        const View = NestingView.extend({
            template: _ => "<div class='a'/><div class='b'/>",
            nestedViews: {
                '.a' : NestingView.extend({
                    template: _ => "<span/>"
                }),
                '.b' : NestingView.extend({
                    template: _ => "<p/>"
                })
            }
        });

        const view = new View({
        });
        view.render();
        
        chai.expect(view.$el.html()).to.be.equal(
            '<div class="a"><span></span></div><div class="b"><p></p></div>');
    });
    
    it("pass specified model", () => {
        const View = NestingView.extend({
            template: _ => "<div><span/><p/></div>",
            nestedViews: {
                'span' : {
                    template: json => json.firstName,
                    model: 'model2'
                }, 
                'p' : {
                    template: json => json.lastName,
                    model: 'model3'
                }
            }
        });

        const view = new View();
        view.model2 = new Backbone.Model({firstName: 'john'});
        view.model3 = new Backbone.Model({lastName: 'doe'});
        view.render();
        
        chai.expect(view.$el.html()).to.be.equal(
            '<div><span>john</span><p>doe</p></div>');
    });

    it("pass specified model as function", () => {
        const View = NestingView.extend({
            template: _ => "<div><span/><p/></div>",
            nestedViews: {
                'span' : {
                    template: json => json.firstName,
                    model: function() { return this.model2 }
                }, 
                'p' : {
                    template: json => json.lastName,
                    model: view => view.model3
                }
            }
        });

        const view = new View();
        view.model2 = new Backbone.Model({firstName: 'john'});
        view.model3 = new Backbone.Model({lastName: 'doe'});
        view.render();
        
        chai.expect(view.$el.html()).to.be.equal(
            '<div><span>john</span><p>doe</p></div>');
    });

    it("pass model by default", () => {
        const View = NestingView.extend({
            template: _ => "<div><span/><p/></div>",
            nestedViews: {
                'span' : {
                    view: NestingView.extend({
                        template: json => json.firstName
                    }),
                }, 
                'p': {
                    view: NestingView.extend({
                        template: json => json.lastName
                    }),
                }
            }
        });

        const view = new View({
            model: new Backbone.Model({firstName: 'john', lastName: 'doe'})
        });
        view.render();
        
        chai.expect(view.$el.html()).to.be.equal(
            '<div><span>john</span><p>doe</p></div>');
    });

    // TODO : how to test ?!
    it("pass other options as view options", () => {
        const View = NestingView.extend({
            template: _ => "<div><span/><p/></div>",
            nestedViews: {
                'span' : {
                    view: NestingView,
                    template: json => json.firstName
                }, 
                'p': {
                    view: NestingView,
                    template: json => json.lastName
                }
            }
        });

        const view = new View({
            model: new Backbone.Model({firstName: 'john', lastName: 'doe'})
        });
        view.render();
        
        chai.expect(view.$el.html()).to.be.equal(
            '<div><span>john</span><p>doe</p></div>');
    });


    it("resolves dynamic view options", () => {
        const View = NestingView.extend({
            template: _ => "<div><span/><p/></div>",
            nestedViews: {
                'span' : {
                    view: NestingView,
                    dynamicOptions: function() {
                        return { 
                            template: json => json.firstName
                        };
                    }
                }, 
                'p': {
                    view: NestingView,
                    template: json => json.lastName
                }
            }
        });

        const view = new View({
            model: new Backbone.Model({firstName: 'john', lastName: 'doe'})
        });
        view.render();
        
        chai.expect(view.$el.html()).to.be.equal(
            '<div><span>john</span><p>doe</p></div>');
    });

    it("defaults to NestingView as view", () => {
        const View = NestingView.extend({
            template: _ => "<div><span/><p/></div>",
            nestedViews: {
                'span' : {
                    template: json => json.firstName
                }, 
                'p': {
                    template: json => json.lastName
                }
            }
        });

        const view = new View({
            model: new Backbone.Model({firstName: 'john', lastName: 'doe'})
        });
        view.render();
        
        chai.expect(view.$el.html()).to.be.equal(
            '<div><span>john</span><p>doe</p></div>');
    });

    it('removes child views when removed', () => {
        const View = NestingView.extend({
            template: _ => "<div><span/><p/></div>",
            nestedViews: {
                'span' : {
                    template: json => json.firstName
                }, 
                'p': {
                    template: json => json.lastName
                }
            }
        });

        const view = new View({
            model: new Backbone.Model({firstName: 'john', lastName: 'doe'})
        });
        view.render();
        view.remove();

        chai.expect(view.$el.html()).to.be.equal('<div><span></span><p></p></div>');
    });

    it('forwards events', () => {
        const View = NestingView.extend({
            template: _ => "<div><span/><p/></div>",
            nestedViews: {
                'span' : {
                    template: json => json.firstName,
                    events: {
                        'click': function() {
                            this.trigger('foo', 'bar');
                        }
                    }
                }, 
                'p': {
                    template: json => json.lastName
                }
            }
        });

        const view = new View({
            model: new Backbone.Model({firstName: 'john', lastName: 'doe'})
        });
        view.render();
        
        const stub = sinon.stub();
        view.on('foo', stub);
        
        view.$('span').click();
        chai.expect(stub.calledWith('bar')).to.be.true;
    });
});
