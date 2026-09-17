import test from 'node:test';
import assert from 'node:assert/strict';
import {displayGeometry} from '../src/display-mode.ts';
import {fetchWithTimeout} from '../src/request.ts';

test('portrait rotates bottom to top and fits physical landscape output', () => {
  assert.deepEqual(displayGeometry(1920,640,true,true), {
    width:640,height:1920,left:0,top:640,transform:'rotate(-90deg) scale(1)'
  });
});
test('device pixel ratio and browser bars do not crop portrait controls', () => {
  for (const [width,height] of [[960,320],[1920,580],[640,1920],[320,960]]) {
    const result=displayGeometry(width,height,true,true);
    const scale=Number(result.transform.match(/scale\((.+)\)/)![1]);
    const rotated=width>height;
    assert.ok(result.left>=0);
    assert.ok((rotated?result.height:result.width)*scale<=width+.01);
    assert.ok((rotated?result.width:result.height)*scale<=height+.01);
    assert.equal(result.transform.startsWith('rotate(-90deg)'),rotated);
  }
});
test('legacy landscape fits reduced WebView CSS viewport', () => {
  assert.equal(displayGeometry(960,320,false,true).transform,'rotate(0deg) scale(0.5)');
});
test('requests work without AbortController and still time out', async () => {
  const originalController=globalThis.AbortController, originalFetch=globalThis.fetch;
  try {
    Object.defineProperty(globalThis,'AbortController',{value:undefined,configurable:true,writable:true});
    globalThis.fetch=async (_url,options) => {
      assert.equal(options?.signal,undefined);
      return new Response('{}');
    };
    assert.equal((await fetchWithTimeout('/test',{},50)).status,200);
    globalThis.fetch=()=>new Promise(()=>{});
    await assert.rejects(fetchWithTimeout('/test',{},5),/timed out/);
  } finally {
    globalThis.AbortController=originalController;
    globalThis.fetch=originalFetch;
  }
});
