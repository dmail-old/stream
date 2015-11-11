// https://streams.spec.whatwg.org/
// https://streams.spec.whatwg.org/#rs-model
// http://jakearchibald.com/2015/thats-so-fetch/

import proto from 'proto';

var DuplexStream = proto.extend({
	constructor(){
		this.buffers = [];
		this.length = 0;
		this.pipes = [];
		this.state = 'opened';

		this.promise = new Promise(function(resolve, reject){
			this.resolve = resolve;
			this.reject = reject;
		}.bind(this));
	},

	pipeTo(stream, options = {}){
		var preventCancel = Boolean(options.preventCancel);
		var preventClose = Boolean(options.preventClose);
		var preventError = Boolean(options.preventError);

		if( this.state === 'cancelled' ){
			if( preventCancel ){
				// throw new Error('stream cancelled : it cannot pipeTo other streams');
				// 
			}
			else{
				stream.cancel();
			}			
		}
		else if( this.state === 'errored' ){
			if( preventError ){
				// 
			}
			else{
				stream.error(this.storedError);
			}
		}
		else{
			this.pipes.push(stream);
			if( this.length ){
				this.buffers.forEach(function(buffer){
					stream.write(buffer);
				}, this);
			}

			if( this.state === 'closed' ){
				if( preventClose ){
					//
				}
				else{
					stream.close();
				}				
			}
		}

		return stream;
	},

	pipeThrough(duplexStream, options){
		return this.pipeTo(duplexStream, options);
	},

	write(data){
		this.buffers.push(data);
		this.length+= data.length;

		this.pipes.forEach(function(pipe){
			pipe.write(data);
		});
	},

	error(e){
		this.state = 'errored';
		this.storedError = e;
		this.pipes.forEach(function(pipe){
			pipe.error(e);
		});
		this.reject(e);
	},

	close(){
		this.pipes.forEach(function(pipe){
			if( pipe.close ){
				pipe.close();
			}
		});
		this.pipes.length = 0;
		this.state = 'closed';
		this.resolve();
	},

	cancel(){
		this.close();
		this.buffers.length = 0;
		this.length = 0;
		this.state = 'cancelled';
	},

	tee(){
		var a = this;
		var b = this.create();

		this.pipeTo(b);

		return [
			a,
			b
		];
	},

	then(a, b){
		return this.promise.then(a, b);
	},

	catch(a){
		return this.then(null, a);
	}
});

export default DuplexStream;