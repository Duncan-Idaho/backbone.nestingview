const chai = require('chai');
const Backbone = require('backbone');
const $ = require('jquery');

const NestingView = require('../nesting_view').NestingView;

describe('When el is specified', () => {
    it('create dom when HTML is passed in', () => {
        const html = '<span id="hello" class="world" data-test="value" />';

        const view = new NestingView({
            el: html
        });

        chai.expect(view.$el).to.have.lengthOf(1);
        chai.expect(view.el).to.be.equal(view.$el[0]);
        
        chai.expect(view.el.tagName).to.be.equal('SPAN');
        chai.expect(view.el.id).to.be.equal('hello');
        chai.expect(view.el.className).to.be.equal('world');
        chai.expect(view.$el.data('test')).to.be.equal('value');
    });

    it('reuse dom when node is passed in', () => {
        const html = '<div><span id="hello" class="world" data-test="value" /></div>';
        const dom = $(html);

        const view = new NestingView({
            el: dom.find('#hello')
        });

        chai.expect(view.$el).to.have.lengthOf(1);
        chai.expect(view.el).to.be.equal(view.$el[0]);
        chai.expect(view.el).to.be.equal(dom.find('#hello')[0]);
        
        chai.expect(view.el.tagName).to.be.equal('SPAN');
        chai.expect(view.el.id).to.be.equal('hello');
        chai.expect(view.el.className).to.be.equal('world');
        chai.expect(view.$el.data('test')).to.be.equal('value');
    });

    it('empty node when removed if renders added html to it', () => {
        const html = '<div><span/></div>';
        const dom = $(html);

        const view = new NestingView({
            el: dom.find('span'),
            template: _ => '<span id="hello" class="world" data-test="value" />'
        });

        view.render();
        chai.expect(dom.html()).to.be.equal(
            '<span><span id="hello" class="world" data-test="value"></span></span>');

        view.remove();
        chai.expect(dom.html()).to.be.equal(
            '<span></span>');
    });

    it('clone dom node if requested', () => {
        const html = '<div><span id="hello" class="world" data-test="value" /></div>';
        const dom = $(html);
        const templateEl = dom.find('#hello');

        const view = new NestingView({
            templateEl: templateEl
        });

        chai.expect(view.el.id).to.be.equal('hello');
        view.el.id = 'hello2';
        chai.expect(view.el.id).to.be.equal('hello2');
        chai.expect(templateEl[0].id).to.be.equal('hello');
    });

    it('does not attach the node in cloning mode', () => {
        const html = '<div><span id="hello" class="world" data-test="value" /></div>';
        const dom = $(html);
        const templateEl = dom.find('#hello');

        const view = new NestingView({
            templateEl: templateEl
        });

        chai.expect(dom.html()).to.be.equal('<span id="hello" class="world" data-test="value"></span>');
    });

    it('removes node when removed after a node was cloned', () => {
        const dom = $('<div/>');
        const templateEl = $('<span id="hello" class="world" data-test="value"/>');

        const view = new NestingView({
            templateEl: templateEl
        });

        dom.append(view.$el);
        chai.expect(dom.html()).to.be.equal('<span id="hello" class="world" data-test="value"></span>');

        view.remove();
        chai.expect(dom.html()).to.be.equal('');
    });
});
