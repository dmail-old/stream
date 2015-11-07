import DuplexStream from '../lib/stream-duplex.js';

// duplexstream is a simplified concept of a readable & writable stream
export function suite(add){
	add("resolved with close()", function(test){
		var streamA = DuplexStream.create(), streamB = DuplexStream.create();

		streamA.close();
		return Promise.all([
			test.willResolve(streamA),
			test.willTimeout(streamB)
		]);
	});

	add("rejected by error()", function(test){
		var streamA = DuplexStream.create();

		streamA.error('error');
		return test.rejectWith(streamA, 'error');
	});

	add("pipeTo call write(), error() & close() of the supplied arg", function(test){
		var streamA = DuplexStream.create(), streamB = DuplexStream.create(), streamC = DuplexStream.create();

		var itemA = {
			write: test.spy(),
		};
		var itemB = {
			close: test.spy()
		};
		var itemC = {
			error: test.spy()
		};

		streamA.write('hello');
		streamB.close();
		streamC.error('error');
		streamC.catch(function(){}); // handle

		streamA.pipeTo(itemA);
		streamB.pipeTo(itemB);
		streamC.pipeTo(itemC);

		return Promise.all([
			test.calledWith(itemA.write, 'hello'),
			test.calledWith(itemB.close),
			test.calledWith(itemC.error, 'error')
		]);
	});

	add("pipeTo remembers previously written data & write them back", function(test){
		var streamA = DuplexStream.create(), streamB = DuplexStream.create();

		streamA.write('yo');
		streamA.pipeTo(streamB);
		streamA.close();

		return test.resolveWith(streamB.then(function(){ return streamB.buffers.join(''); }), 'yo');
	});
}
