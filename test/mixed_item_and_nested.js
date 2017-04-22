const chai = require('chai');
const Backbone = require('backbone');

const NestingView = require('../nesting_view').NestingView;

describe('with both item views and nested views', function() {
    const View = NestingView.extend({
        template: json => "<h1>" + json.title + "</h1>"
            + '<div><span class="context"/><span class="update-date"/></div>'
            + "<ul><li/></ul>",
        nestedViews: {
            '.context' : {
                model: 'parent_model',
                template: json => json.title
            }, 
            '.update-date' : {
                template: json => "Updated last " + json.update_date
            }
        },
        itemViews : {
            'ul' : {
                template: json => json.title,
            }
        },
        pickOptions: 'parent_model'
    });

    let view;
    beforeEach(() => {
        view = new View({
            model: new Backbone.Model({title: "Books", update_date: "10/10/10"}),
            parent_model: new Backbone.Model({title: "Wishlist of johns"}),
            collection: new Backbone.Collection([
                { title: "Hunger Mockingbird" },
                { title: "Harry's Games" },
                { title: "Kill Potter" },
            ])
        });            
    })

    it('renders both', function() {
        view.render();

        chai.expect(view.$el.html()).to.be.equal('<h1>Books</h1>'
            +'<div>'
                +'<span class="context">Wishlist of johns</span>'
                +'<span class="update-date">Updated last 10/10/10</span>'
            +'</div>'
            +'<ul>'
                +'<li>Hunger Mockingbird</li>'
                +"<li>Harry's Games</li>"
                +'<li>Kill Potter</li>'
            +'</ul>');
    });

    it('removes both', function() {
        view.render();
        view.remove();

        chai.expect(view.$el.html()).to.be.equal('<h1>Books</h1>'
            + '<div><span class="context"></span><span class="update-date"></span></div><ul></ul>');
    });
});