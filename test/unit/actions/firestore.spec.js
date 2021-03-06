import createFirestoreInstance from '../../../src/createFirestoreInstance';
import { firestoreActions } from '../../../src/actions';
import { setListeners } from '../../../src/actions/firestore';
import { actionTypes, defaultConfig } from '../../../src/constants';

let dispatchSpy;
let fakeFirebase;
let listenerConfig;
let collectionClass;
let onSnapshotSpy;

const fakeConfig = {
  helpersNamespace: 'test',
};

describe('firestoreActions', () => {
  beforeEach(() => {
    dispatchSpy = sinon.spy();
    onSnapshotSpy = sinon.spy((func, func2) => {
      func(sinon.spy());
      func2(sinon.spy());
    });
    listenerConfig = {};
    collectionClass = () => ({
      doc: () => ({ collection: collectionClass, onSnapshot: onSnapshotSpy }),
      onSnapshot: onSnapshotSpy,
    });
    fakeFirebase = {
      _: { listeners: {}, config: defaultConfig },
      firestore: () => ({
        collection: collectionClass,
      }),
    };
  });

  describe('exports', () => {
    it('add', () => {
      expect(firestoreActions).to.be.respondTo('add');
    });
  });

  describe('actions', () => {
    describe('add', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.add({ collection: 'test' })).to.throw(
          'Firestore must be required and initalized.',
        );
      });
    });

    describe('set', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.set({ collection: 'test' })).to.throw(
          'Firestore must be required and initalized.',
        );
      });
    });

    describe('update', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.update({ collection: 'test' })).to.throw(
          'Firestore must be required and initalized.',
        );
      });
    });

    describe('deleteRef', () => {
      it('throws if attempting to delete a collection', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.deleteRef({ collection: 'test' })).to.throw(
          'Only docs can be deleted.',
        );
      });
    });

    describe('get', () => {
      it('throws if attempting to delete a collection', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.get({ collection: 'test' })).to.throw(
          'Firestore must be required and initalized.',
        );
      });
    });

    describe('setListener', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.setListener({ collection: 'test' }),
        ).to.throw('Firestore must be required and initalized.');
      });

      it('throws if Collection and/or doc are not provided', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        expect(() => instance.test.setListener({})).to.throw(
          'Collection and/or Doc are required parameters within query definition object.',
        );
      });

      it('calls success callback if it exists', async () => {
        const successSpy = sinon.spy();
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        await instance.test.setListener({ collection: 'test' }, successSpy);
        expect(successSpy).to.have.been.calledOnce;
      });

      it('calls error callback if it exists', async () => {
        const errorSpy = sinon.spy();
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        await instance.test.setListener(
          { collection: 'test' },
          () => {},
          errorSpy,
        );
        expect(errorSpy).to.have.been.calledOnce;
      });

      it('supports subcollections', async () => {
        listenerConfig = {
          collection: 'test',
          doc: '1',
          subcollections: [{ collection: 'test2', doc: 'test3' }],
        };
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        const expectedAction = {
          meta: { ...listenerConfig },
          payload: { name: 'test/1/test2/test3' },
          type: actionTypes.SET_LISTENER,
        };
        await instance.test.setListener(listenerConfig);
        expect(onSnapshotSpy).to.be.calledOnce;
        expect(dispatchSpy).to.be.calledWith(expectedAction);
      });

      it('supports subcollections of subcollections', async () => {
        listenerConfig = {
          collection: 'test',
          doc: '1',
          subcollections: [
            { collection: 'test2', doc: 'test3' },
            { collection: 'test4' },
          ],
        };
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        const expectedAction = {
          meta: { ...listenerConfig },
          payload: { name: 'test/1/test2/test3/test4' },
          type: actionTypes.SET_LISTENER,
        };
        await instance.test.setListener(listenerConfig);
        expect(onSnapshotSpy).to.be.calledOnce;
        expect(dispatchSpy).to.be.calledWith(expectedAction);
      });
    });

    describe('setListeners', () => {
      it('throws if listeners config is not an array', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.setListeners({ collection: 'test' }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects).',
        );
      });

      it('calls dispatch if listeners provided', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.setListeners({ collection: 'test' }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects).',
        );
      });

      it('maps listeners array', () => {
        setListeners(fakeFirebase, dispatchSpy, [
          { collection: 'test' },
          { collection: 'test2' },
        ]);
        expect(onSnapshotSpy).to.be.calledTwice;
      });

      it('supports subcollections', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.setListeners({
            collection: 'test',
            doc: '1',
            subcollections: [{ collection: 'test2' }],
          }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects).',
        );
      });
    });

    describe('unsetListener', () => {
      it('throws if invalid path config is provided', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.unsetListener()).to.throw(
          'Invalid Path Definition: Only Strings and Objects are accepted.',
        );
      });

      it('throws if dispatch is not a function', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.unsetListener({ collection: 'test' }),
        ).to.throw('dispatch is not a function');
      });
    });

    describe('unsetListeners', () => {
      it('throws if listeners config is not an array', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.unsetListeners({ collection: 'test' }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects)',
        );
      });

      it('dispatches UNSET_LISTENER action', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        instance.test.unsetListeners([{ collection: 'test' }]);
        expect(dispatchSpy).to.have.been.calledWith({
          meta: { collection: 'test' },
          payload: { name: 'test' },
          type: actionTypes.UNSET_LISTENER,
        });
      });
    });
  });
});
