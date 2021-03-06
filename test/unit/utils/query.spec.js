import {
  attachListener,
  detachListener,
  getQueryConfigs,
  getQueryName,
  firestoreRef,
  orderedFromSnap,
  dataByIdSnapshot,
} from '../../../src/utils/query';
import { actionTypes } from '../../../src/constants';

let dispatch = sinon.spy();
let meta;
let result;

describe('query utils', () => {
  beforeEach(() => {
    dispatch = sinon.spy();
  });

  describe('getQueryName', () => {
    it('throws for no collection name', () => {
      expect(() => getQueryName({})).to.throw(
        'Collection is required to build query name',
      );
    });

    it('returns collection name', () => {
      meta = { collection: 'test' };
      result = getQueryName(meta);
      expect(result).to.equal(meta.collection);
    });

    it('returns collection/doc', () => {
      meta = { collection: 'test', doc: 'doc' };
      result = getQueryName(meta);
      expect(result).to.equal(`${meta.collection}/${meta.doc}`);
    });

    describe('where paremeter', () => {
      it('is appended if valid', () => {
        meta = { collection: 'test', doc: 'doc', where: 'some' };
        expect(() => getQueryName(meta)).to.throw(
          'where parameter must be an array.',
        );
      });

      it('is appended if valid', () => {
        const where1 = 'some';
        const where2 = 'other';
        meta = {
          collection: 'test',
          doc: 'doc',
          where: [where1, '==', where2],
        };
        result = getQueryName(meta);
        expect(result).to.equal(
          `${meta.collection}/${meta.doc}?where::${where1}==${where2}`,
        );
      });
    });
  });

  describe('attachListener', () => {
    it('is exported', () => {
      expect(attachListener).to.be.a('function');
    });

    it('converts slash path to dot path', () => {
      attachListener({ _: { listeners: {} } }, dispatch, {
        collection: 'test',
      });
      expect(dispatch).to.be.calledOnce;
    });

    it('throws if meta is not included', () => {
      expect(() => attachListener({}, dispatch)).to.Throw(
        'Meta data is required to attach listener.',
      );
    });

    it('throws if _ variable is not defined on Firebase', () => {
      expect(() =>
        attachListener({}, dispatch, { collection: 'test' }),
      ).to.Throw(
        'Internal Firebase object required to attach listener. Confirm that reduxFirestore enhancer was added when you were creating your store',
      );
    });

    describe('converts slash path to dot path', () => {
      beforeEach(() => {
        dispatch = sinon.spy();
      });

      it('for collection', () => {
        meta = { collection: 'test' };
        attachListener({ _: { listeners: {} } }, dispatch, meta);
        expect(dispatch).to.be.calledWith({
          meta,
          payload: { name: 'test' },
          type: '@@reduxFirestore/SET_LISTENER',
        });
      });

      it('for collection and document', () => {
        meta = { collection: 'test', doc: 'doc' };
        attachListener({ _: { listeners: {} } }, dispatch, meta);
        expect(dispatch).to.be.calledWith({
          meta,
          payload: { name: `${meta.collection}/${meta.doc}` },
          type: '@@reduxFirestore/SET_LISTENER',
        });
      });

      it('for collection, document, and subcollections', () => {
        meta = {
          collection: 'test',
          doc: 'doc',
          subcollections: [{ collection: 'test' }],
        };
        attachListener({ _: { listeners: {} } }, dispatch, meta);
        expect(dispatch).to.be.calledWith({
          meta,
          payload: {
            name: `${meta.collection}/${meta.doc}/${
              meta.subcollections[0].collection
            }`,
          },
          type: '@@reduxFirestore/SET_LISTENER',
        });
      });
    });

    it('throws if meta is not included', () => {
      expect(() => attachListener({}, dispatch)).to.Throw(
        'Meta data is required to attach listener.',
      );
    });

    it('throws if _ variable is not defined on Firebase', () => {
      expect(() =>
        attachListener({}, dispatch, { collection: 'test' }),
      ).to.Throw(
        'Internal Firebase object required to attach listener. Confirm that reduxFirestore enhancer was added when you were creating your store',
      );
    });
  });

  describe('detachListener', () => {
    it('is exported', () => {
      expect(detachListener).to.be.a('function');
    });

    it('calls dispatch with unlisten actionType', () => {
      const callbackSpy = sinon.spy();
      const collection = 'test';
      detachListener({ _: { listeners: { test: callbackSpy } } }, dispatch, {
        collection,
      });
      expect(dispatch).to.be.calledWith({
        type: actionTypes.UNSET_LISTENER,
        meta: { collection },
        payload: { name: collection },
      });
    });

    it('calls unlisten if listener exists', () => {
      const callbackSpy = sinon.spy();
      detachListener({ _: { listeners: { test: callbackSpy } } }, dispatch, {
        collection: 'test',
      });
      expect(dispatch).to.be.calledOnce;
    });

    it('detaches listener if it exists', () => {
      const callbackSpy = sinon.spy();
      detachListener({ _: { listeners: { test: callbackSpy } } }, dispatch, {
        collection: 'test',
      });
      expect(dispatch).to.be.calledOnce;
    });
  });

  describe('getQueryConfigs', () => {
    it('is exported', () => {
      expect(getQueryConfigs).to.be.a('function');
    });

    it('it throws for invalid input', () => {
      expect(() => getQueryConfigs(1)).to.Throw(
        'Querie(s) must be an Array or a string',
      );
    });

    describe('array', () => {
      it('with collection in string', () => {
        expect(getQueryConfigs(['test'])).to.have.nested.property(
          '0.collection',
          'test',
        );
      });

      it('with collection in an object', () => {
        expect(
          getQueryConfigs([{ collection: 'test' }]),
        ).to.have.nested.property('0.collection', 'test');
      });

      it('with collection and doc in an object', () => {
        meta = [{ collection: 'test', doc: 'other' }];
        result = getQueryConfigs(meta);
        expect(result).to.have.nested.property(
          '0.collection',
          meta[0].collection,
        );
        expect(result).to.have.nested.property('0.doc', meta[0].doc);
      });

      it('throws invalid object', () => {
        meta = [{ test: 'test' }];
        expect(() => getQueryConfigs(meta)).to.Throw(
          'Collection and/or Doc are required parameters within query definition object',
        );
      });
    });

    describe('string', () => {
      it('with collection', () => {
        expect(getQueryConfigs('test')).to.have.property('collection', 'test');
      });
    });

    describe('object', () => {
      it('with collection', () => {
        expect(getQueryConfigs({ collection: 'test' })).to.have.nested.property(
          '0.collection',
          'test',
        );
      });

      it('with doc', () => {
        meta = { collection: 'test', doc: 'other' };
        result = getQueryConfigs(meta);
        expect(result).to.have.nested.property('0.collection', meta.collection);
        expect(result).to.have.nested.property('0.doc', meta.doc);
      });

      it('with subcollections', () => {
        meta = {
          collection: 'test',
          doc: 'other',
          subcollections: [{ collection: 'thing' }],
        };
        result = getQueryConfigs(meta);
        expect(result).to.have.nested.property('0.collection', meta.collection);
        expect(result).to.have.nested.property('0.doc', meta.doc);
        expect(result).to.have.nested.property(
          '0.subcollections.0.collection',
          meta.subcollections[0].collection,
        );
      });
    });
  });

  describe('firestoreRef', () => {
    beforeEach(() => {
      dispatch = sinon.spy();
    });

    describe('doc', () => {
      it('creates ref', () => {
        meta = { collection: 'test', doc: 'other' };
        const docSpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ doc: docSpy }) }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(docSpy).to.be.calledWith(meta.doc);
      });
    });

    describe('subcollections', () => {
      it('creates ref with collection', () => {
        meta = {
          collection: 'test',
          doc: 'other',
          subcollections: [{ collection: 'thing' }],
        };
        const docSpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({
            collection: () => ({
              doc: () => ({
                collection: () => ({ doc: docSpy }),
              }),
            }),
          }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        // expect(docSpy).to.be.calledOnce(meta.subcollections[0].collection);
      });

      it('creates ref with doc', () => {
        meta = {
          collection: 'test',
          doc: 'other',
          subcollections: [{ collection: 'thing', doc: 'again' }],
        };
        const docSpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({
            collection: () => ({
              doc: () => ({
                collection: () => ({ doc: docSpy }),
              }),
            }),
          }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(docSpy).to.be.calledWith(meta.subcollections[0].doc);
      });

      it('calls where if provided where parameter', () => {
        const testVal = 'some';
        meta = {
          collection: 'test',
          doc: 'other',
          subcollections: [
            { collection: 'thing', doc: 'again', where: [testVal] },
          ],
        };
        const whereSpy = sinon.spy();
        const docSpy = sinon.spy(() => ({ where: whereSpy }));
        const fakeFirebase = {
          firestore: () => ({
            collection: () => ({
              doc: () => ({
                collection: () => ({ doc: docSpy }),
              }),
            }),
          }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(docSpy).to.be.calledWith(meta.subcollections[0].doc);
        expect(whereSpy).to.be.calledWith(testVal);
      });

      describe('orderBy', () => {
        it('calls orderBy if valid', () => {
          meta = {
            collection: 'test',
            doc: 'other',
            subcollections: [
              { collection: 'thing', doc: 'again', orderBy: 'some' },
            ],
          };
          const orderBySpy = sinon.spy(() => ({}));
          const docSpy = sinon.spy(() => ({ orderBy: orderBySpy }));
          const fakeFirebase = {
            firestore: () => ({
              collection: () => ({
                doc: () => ({
                  collection: () => ({ doc: docSpy }),
                }),
              }),
            }),
          };
          result = firestoreRef(fakeFirebase, dispatch, meta);
          expect(result).to.be.an('object');
          expect(orderBySpy).to.be.calledWith(meta.subcollections[0].orderBy);
        });
      });

      describe('limit', () => {
        it('calls limit if valid', () => {
          meta = {
            collection: 'test',
            doc: 'other',
            subcollections: [
              { collection: 'thing', doc: 'again', limit: 'some' },
            ],
          };
          const limitSpy = sinon.spy(() => ({}));
          const docSpy = sinon.spy(() => ({ limit: limitSpy }));
          const fakeFirebase = {
            firestore: () => ({
              collection: () => ({
                doc: () => ({
                  collection: () => ({ doc: docSpy }),
                }),
              }),
            }),
          };
          result = firestoreRef(fakeFirebase, dispatch, meta);
          expect(result).to.be.an('object');
          expect(limitSpy).to.be.calledWith(meta.subcollections[0].limit);
        });
      });
    });

    describe('where', () => {
      it('calls where if valid', () => {
        meta = { collection: 'test', where: ['other'] };
        const whereSpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ where: whereSpy }) }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(whereSpy).to.be.calledWith(meta.where[0]);
      });

      it('handles array of arrays', () => {
        meta = { collection: 'test', where: [['other', '===', 'test']] };
        const whereSpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ where: whereSpy }) }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(whereSpy).to.be.calledOnce;
      });

      it('throws for invalid where parameter', () => {
        meta = { collection: 'test', where: 'other' };
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ where: () => ({}) }) }),
        };
        expect(() => firestoreRef(fakeFirebase, dispatch, meta)).to.throw(
          'where parameter must be an array.',
        );
      });

      it('throws for invalid where parameter within array', () => {
        meta = { collection: 'test', where: [false] };
        const whereSpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ where: whereSpy }) }),
        };
        expect(() => firestoreRef(fakeFirebase, dispatch, meta)).to.throw(
          'where parameter must be an array.',
        );
      });
    });

    describe('orderBy', () => {
      it('calls orderBy if valid', () => {
        meta = { collection: 'test', orderBy: ['other'] };
        const orderBySpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ orderBy: orderBySpy }) }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(orderBySpy).to.be.calledWith(meta.orderBy[0]);
      });

      it('handles array of arrays', () => {
        meta = { collection: 'test', orderBy: [['other']] };
        const orderBySpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ orderBy: orderBySpy }) }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(orderBySpy).to.be.calledWith(meta.orderBy[0][0]);
      });

      it('throws for invalid orderBy parameter', () => {
        meta = { collection: 'test', orderBy: () => {} };
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ orderBy: () => ({}) }) }),
        };
        expect(() => firestoreRef(fakeFirebase, dispatch, meta)).to.throw(
          'orderBy parameter must be an array or string.',
        );
      });
    });

    describe('limit', () => {
      it('calls limit if valid', () => {
        meta = { collection: 'test', limit: 'other' };
        const limitSpy = sinon.spy(() => ({}));
        const fakeFirebase = {
          firestore: () => ({ collection: () => ({ limit: limitSpy }) }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(limitSpy).to.be.calledWith(meta.limit);
      });
    });
  });

  describe('orderedFromSnap', () => {
    it('returns empty array if data does not exist', () => {
      result = orderedFromSnap({});
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });

    it('returns an array containing data if it exists', () => {
      const id = 'someId';
      const fakeData = { some: 'thing' };
      result = orderedFromSnap({ id, data: () => fakeData, exists: true });
      expect(result).to.be.an('array');
      expect(result[0]).to.have.property('id', id);
      expect(result[0]).to.have.property('some');
    });

    it('returns an array non object data within an object containing id and data parameters', () => {
      const id = 'someId';
      const fakeData = 'some';
      result = orderedFromSnap({ id, data: () => fakeData, exists: true });
      expect(result).to.be.an('array');
      expect(result[0]).to.have.property('id', id);
      expect(result[0]).to.have.property('data', fakeData);
    });

    it('returns an array containing children if they exist', () => {
      const id = 'someId';
      const fakeData = 'some';
      result = orderedFromSnap({
        forEach: func => func({ data: () => fakeData, id }),
      });
      expect(result).to.be.an('array');
      expect(result[0]).to.have.property('id', id);
    });
  });

  describe('dataByIdSnapshot', () => {
    it('sets data by id if valid', () => {
      const id = 'someId';
      const fakeData = 'some';
      result = dataByIdSnapshot({ id, data: () => fakeData, exists: true });
      expect(result).to.have.property(id, fakeData);
    });

    it('supports collection data', () => {
      const id = 'someId';
      const fakeData = 'some';
      result = dataByIdSnapshot({
        forEach: func => func({ data: () => fakeData, id }),
      });
      expect(result).to.have.property(id, fakeData);
    });

    it('returns null if no data returned', () => {
      const id = 'someId';
      result = dataByIdSnapshot({ id, data: () => ({}) });
      expect(result).to.be.null;
    });
  });
});
