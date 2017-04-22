const chai = require('chai');
const Backbone = require('backbone');

const NestingView = require('../nesting_view').NestingView;

describe('When no el is specified', () => {
    it('create an element when initialized', () => {
        const view = new NestingView({
            'id': 'hello',
            'className' : 'world',
            'tagName': 'span',
            'attributes': {
                'data-test': 'value'
            }
        })

        chai.expect(view.$el).to.have.lengthOf(1);
        chai.expect(view.el).to.not.be.undefined;
        chai.expect(view.el).to.not.be.null;
        chai.expect(view.el).to.be.equal(view.$el[0]);
    });

    it('use data from object itself if available', () => {
        const View = NestingView.extend({
            'id': 'hello',
            'className' : 'world',
            'tagName': 'span',
            'attributes': {
                'data-test': 'value'
            }
        });
        const view = new View();

        chai.expect(view.el.tagName).to.be.equal('SPAN');
        chai.expect(view.el.id).to.be.equal('hello');
        chai.expect(view.el.className).to.be.equal('world');
        chai.expect(view.$el.data('test')).to.be.equal('value');
    });
});
