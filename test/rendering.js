const _ = require('underscore');
const chai = require('chai');
const sinon = require('sinon');
const Backbone = require('backbone');

const NestingView = require('../nesting_view').NestingView;

describe('for single element', () => {
    it('do not render unless asked', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li>Bullet Point</li></ul>"
        });
        const view = new View();

        chai.expect(view.$el.children()).to.have.lengthOf(0);
    });

    it('use template', () => {
        const View = NestingView.extend({
            template: _ => "<ul><li>Bullet Point</li></ul>"
        });
        const view = new View();

        view.render();

        chai.expect(view.$el.children()).to.have.lengthOf(1);
        chai.expect(view.$('li')).to.have.lengthOf(1);
        chai.expect(view.$('li').text()).to.be.equal("Bullet Point");
    });

    it('sends model toJSON to template if available', () => {
        const json = {a:'a'};
        const model = {toJSON : _ => json};
        const stub = sinon.stub();

        const View = NestingView.extend({
            model: model,
            template: stub
        });
        const view = new View();

        view.render();

        chai.expect(stub.callCount).to.be.equal(1);
        chai.expect(stub.calledWith(sinon.match.same(json))).to.be.true;
    });

    it('sends model if no toJSON available', () => {
        const model = {a:'a'};
        const stub = sinon.stub();

        const View = NestingView.extend({
            model: model,
            template: stub
        });
        const view = new View();

        view.render();

        chai.expect(stub.callCount).to.be.equal(1);
        chai.expect(stub.calledWith(sinon.match.same(model))).to.be.true;
    });

    it('sends nothing if no model available', () => {
        const stub = sinon.stub();

        const View = NestingView.extend({
            template: stub
        });
        const view = new View();

        view.render();

        chai.expect(stub.callCount).to.be.equal(1);
        chai.expect(stub.calledWith(sinon.match.undefined)).to.be.true;
    });
});
