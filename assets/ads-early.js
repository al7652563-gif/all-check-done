/* Defines ad slots as early as possible (in <head>), so the request
   fires immediately. The actual display() calls happen later, from
   funnel.js, with a small delay so they don't visually collide with
   the page-transition animation. */
googletag.cmd.push(function () {
  googletag.defineSlot('/23313830399/TOP', [[320, 50], [300, 50]], 'div-gpt-ad-1787049080357-0').addService(googletag.pubads());
  googletag.defineSlot('/23313830399/BOTTOM', [[300, 250], [336, 280]], 'div-gpt-ad-1787049302190-0').addService(googletag.pubads());
  googletag.enableServices();
});
