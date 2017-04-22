const chai = require('chai');

const NestingView = require('../nesting_view').NestingView;

describe('Base view always', () => {
    it('keeps all options passed in', () => {
        const view = new NestingView({
            hello: 'world'
        });

        chai.expect(view.hello).to.be.equal('world');
    });
});
