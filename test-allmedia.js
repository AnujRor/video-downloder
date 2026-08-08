import nayan from 'nayan-media-downloaders';
import allmedia from 'allmediadl';

async function test() {
  try {
    const res = await nayan.alldown('https://www.instagram.com/reel/DE-R0k0uY_e/');
    console.log('nayan:', res);
  } catch (e) {
    console.error('nayan fail:', e.message);
  }
  
  try {
    const res = await allmedia.igdl('https://www.instagram.com/reel/DE-R0k0uY_e/');
    console.log('allmedia:', res);
  } catch(e) {
     console.error('allmedia fail:', e.message);
  }
}
test();
