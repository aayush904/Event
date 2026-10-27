import type { CategoryId, DB, EventItem, Organizer, RefundPolicy, TicketType } from './types';
import { hashPassword } from './format';

const organizers: Organizer[] = [
  { id: 'o-lowtide', name: 'Low Tide Sound', city: 'New York', baseFollowers: 4120, bio: 'Small rooms, loud bands. We have been booking basement shows in Brooklyn since 2014 and still answer our own email.' },
  { id: 'o-saltfat', name: 'Salt & Fat Supper Club', city: 'Chicago', baseFollowers: 1873, bio: 'Long tables, one menu, strangers who leave as friends. Hosted by chefs between restaurant gigs.' },
  { id: 'o-buildnight', name: 'Build Night', city: 'San Francisco', baseFollowers: 9310, bio: 'Monthly demos from people shipping real things. No pitch decks, no panels — just laptops on a stage.' },
  { id: 'o-greenroom', name: 'The Green Room Collective', city: 'London', baseFollowers: 2640, bio: 'An actor-run company staging new writing in pubs, warehouses and the occasional laundrette.' },
  { id: 'o-eastside', name: 'Eastside Run Club', city: 'Austin', baseFollowers: 3305, bio: 'Thursday 5Ks that end at a taco truck. Every pace welcome, nobody gets left behind.' },
  { id: 'o-reelhouse', name: 'Reelhouse Cinema', city: 'Los Angeles', baseFollowers: 6022, bio: 'A 90-seat independent screen showing restorations, cult picks and first features.' },
  { id: 'o-clayday', name: 'Clay Day Studio', city: 'Toronto', baseFollowers: 1190, bio: 'Wheel throwing and hand-building classes for total beginners. Aprons provided, mess encouraged.' },
  { id: 'o-founders', name: 'Founders After Five', city: 'New York', baseFollowers: 5480, bio: 'Operator-led talks and a drink afterwards. For people building companies, not just talking about it.' },
  { id: 'o-stillwater', name: 'Stillwater Wellness', city: 'Los Angeles', baseFollowers: 2210, bio: 'Breathwork, sound baths and slow yoga. Phones off at the door.' },
  { id: 'o-plotline', name: 'Plotline Books', city: 'Chicago', baseFollowers: 980, bio: 'An independent bookstore hosting readings, signings and the city’s most argumentative book club.' },
  { id: 'o-nachtwerk', name: 'Nachtwerk', city: 'Berlin', baseFollowers: 12040, bio: 'Techno and house programming across three rooms. Door policy: be kind.' },
  { id: 'o-openweb', name: 'Open Web Guild', city: 'Online', baseFollowers: 7720, bio: 'Free and low-cost online workshops on web standards, accessibility and design systems.' },
];

type Seed = {
  title: string;
  org: string;
  cat: CategoryId;
  city: string;
  venue?: [string, string];
  day: number;
  hour: number;
  len: number;
  tickets: [string, number, number, number][]; // name, price $, qty, sold
  summary: string;
  body: string[];
  tags: string[];
  refund?: RefundPolicy;
  agenda?: [string, string][];
  age?: string;
};

const seeds: Seed[] = [
  { title: 'Weird Nightmare + Pale Lungs', org: 'o-lowtide', cat: 'music', city: 'New York', venue: ['Union Pool Basement', '484 Union Ave, Brooklyn, NY'], day: 0, hour: 20, len: 4, tickets: [['General admission', 22, 180, 151], ['Door (if available)', 28, 40, 0]], summary: 'Two bands, one sweaty room. Doors at 8, first set at 9.', body: ['Weird Nightmare bring the new record to Brooklyn for the first time, with Pale Lungs opening. Expect fuzz, harmonies and at least one broken string.', 'The basement holds 220 people. When it is full, it is full — grab tickets ahead if you can.'], tags: ['indie', 'live music', 'brooklyn'], age: '21+', refund: '1day' },
  { title: 'Late Night Jazz at the Annex', org: 'o-lowtide', cat: 'music', city: 'New York', venue: ['The Annex', '152 Orchard St, New York, NY'], day: 3, hour: 22, len: 3, tickets: [['Bar seating', 15, 60, 22], ['Table for two', 45, 20, 9]], summary: 'A rotating trio plays standards until 1am. Sit-ins welcome after midnight.', body: ['Our house trio plays two sets of standards and deep cuts. After midnight the stage opens up to anyone who brought a horn.', 'Two-drink suggested minimum at tables.'], tags: ['jazz', 'late night'], age: '21+' },
  { title: 'Whole Hog: A Southern Supper', org: 'o-saltfat', cat: 'food-drink', city: 'Chicago', venue: ['Fulton Street Loft', '1132 W Fulton St, Chicago, IL'], day: 5, hour: 19, len: 3, tickets: [['Seat at the table', 95, 40, 38]], summary: 'Six courses built around one heritage pig, served family style.', body: ['Chef Dana Whitlock breaks down a whole Mangalitsa in front of you, then we eat it — six courses, from crackling to smoked shoulder to lard-crust pie.', 'Natural wine pairings are available at the door. Tell us about allergies when you book; we can work around most of them.'], tags: ['supper club', 'bbq', 'wine'], refund: '7days', agenda: [['7:00 PM', 'Welcome punch & butchery demo'], ['7:45 PM', 'Courses one through three'], ['8:45 PM', 'Main course & sides'], ['9:30 PM', 'Pie']] },
  { title: 'Dumpling Workshop for Two', org: 'o-saltfat', cat: 'classes', city: 'Chicago', venue: ['Salt & Fat Kitchen', '2212 N Milwaukee Ave, Chicago, IL'], day: 12, hour: 18, len: 2, tickets: [['Pair ticket', 120, 12, 7]], summary: 'Fold, pleat and pan-fry. You take home a bag for the freezer.', body: ['A hands-on class for couples, roommates or a very committed solo eater. We cover three folds, two fillings and a dipping sauce you will make forever.'], tags: ['cooking', 'date night'], refund: '7days' },
  { title: 'Build Night #48: Local-first apps', org: 'o-buildnight', cat: 'tech', city: 'San Francisco', venue: ['The Pond', '535 Mission St, San Francisco, CA'], day: 2, hour: 18, len: 3, tickets: [['Free RSVP', 0, 300, 212], ['Supporter (pizza fund)', 10, 50, 31]], summary: 'Five live demos of apps that work offline and sync later.', body: ['Each builder gets eight minutes and a projector. No slides allowed — if it does not run, it does not count.', 'Food and drinks from 6, demos start 6:45 sharp.'], tags: ['software', 'demos', 'sync'], agenda: [['6:00 PM', 'Doors, pizza'], ['6:45 PM', 'Demos'], ['8:00 PM', 'Hang out']] },
  { title: 'Build Night Online: Shipping with tiny teams', org: 'o-buildnight', cat: 'tech', city: 'Online', day: 9, hour: 17, len: 1.5, tickets: [['Free', 0, 1000, 446]], summary: 'Three two-person teams show what they built this quarter.', body: ['The online edition of Build Night. Stream link arrives by email an hour before.'], tags: ['startups', 'remote'] },
  { title: 'The Laundrette — a new play', org: 'o-greenroom', cat: 'performing-arts', city: 'London', venue: ['Soap Suds Launderette', '41 Kingsland Rd, London'], day: 6, hour: 19, len: 1.5, tickets: [['Standard', 18, 30, 30], ['Concession', 12, 10, 10]], summary: 'Staged in a working laundrette after hours. Thirty seats, no interval.', body: ['Two strangers, one broken dryer, a Tuesday that will not end. Written by Priya Nandakumar, directed by Tom Ashby.', 'Seating is on folding chairs and, for the brave, the folding table.'], tags: ['theatre', 'new writing'], refund: 'none' },
  { title: 'Scratch Night: works in progress', org: 'o-greenroom', cat: 'performing-arts', city: 'London', venue: ['The Old Ship', '17 Cambridge Heath Rd, London'], day: 20, hour: 19, len: 2.5, tickets: [['Pay what you can', 5, 80, 19]], summary: 'Ten-minute pieces from six writers. Stay after and tell them what you think.', body: ['A rough-and-ready showcase of plays still being written. Feedback cards on every seat.'], tags: ['theatre', 'pub'] },
  { title: 'Thursday 5K + Tacos', org: 'o-eastside', cat: 'sports', city: 'Austin', venue: ['Pan Am Park', '2100 E 3rd St, Austin, TX'], day: 3, hour: 18, len: 1.5, tickets: [['Free run', 0, 150, 64]], summary: 'Flat loop, two pace groups, tacos after. Bring a headlamp.', body: ['We meet by the rec center doors at 6:15 and head out at 6:30. Route is mostly flat with one sneaky hill.', 'First taco is on us if you sign the waiver.'], tags: ['running', 'social'] },
  { title: 'Lady Bird Lake Half Training Kickoff', org: 'o-eastside', cat: 'sports', city: 'Austin', venue: ['Auditorium Shores', '800 W Riverside Dr, Austin, TX'], day: 14, hour: 7, len: 2, tickets: [['12-week plan + shirt', 35, 100, 41]], summary: 'Twelve weeks to race day, starting with a gentle 6-miler.', body: ['Join a structured training block with weekly long runs, a coach on WhatsApp and a shirt you will actually wear.'], tags: ['running', 'training'], refund: '7days' },
  { title: 'Midnight Movies: Repo Man (35mm)', org: 'o-reelhouse', cat: 'film', city: 'Los Angeles', venue: ['Reelhouse Cinema', '1822 Sunset Blvd, Los Angeles, CA'], day: 4, hour: 23, len: 2, tickets: [['Seat', 14, 90, 57]], summary: 'Alex Cox’s punk sci-fi on a fresh 35mm print.', body: ['The plate of shrimp is real. Introduced by our projectionist, who will explain why the reel change matters.'], tags: ['cult', '35mm', 'repertory'], age: '18+' },
  { title: 'First Features Festival — Opening Night', org: 'o-reelhouse', cat: 'film', city: 'Los Angeles', venue: ['Reelhouse Cinema', '1822 Sunset Blvd, Los Angeles, CA'], day: 18, hour: 19, len: 4, tickets: [['Screening + Q&A', 20, 90, 33], ['Festival pass (5 nights)', 80, 30, 12]], summary: 'A debut feature, its director and a room full of people who care.', body: ['Five nights of first films from directors under 30. Opening night closes with a Q&A and a party in the lot.'], tags: ['festival', 'indie film'], refund: '7days' },
  { title: 'Wheel Throwing for Beginners', org: 'o-clayday', cat: 'classes', city: 'Toronto', venue: ['Clay Day Studio', '985 Bloor St W, Toronto, ON'], day: 1, hour: 18, len: 2.5, tickets: [['Single class', 65, 10, 8]], summary: 'Center, open, pull. Leave with two pieces to be fired and glazed.', body: ['No experience needed. We keep classes to ten people so everyone gets time with an instructor.', 'Pieces are ready to collect two weeks later.'], tags: ['pottery', 'ceramics'], refund: '1day' },
  { title: 'Hand-Building Mugs Night', org: 'o-clayday', cat: 'hobbies', city: 'Toronto', venue: ['Clay Day Studio', '985 Bloor St W, Toronto, ON'], day: 10, hour: 19, len: 2, tickets: [['Seat', 55, 12, 4]], summary: 'Slab, pinch and coil your way to a mug that is entirely your fault.', body: ['BYOB. We provide clay, tools, snacks and a playlist.'], tags: ['pottery', 'byob'] },
  { title: 'Pricing Is a Product: an evening with three operators', org: 'o-founders', cat: 'business', city: 'New York', venue: ['WeWork 115 W 18th', '115 W 18th St, New York, NY'], day: 7, hour: 18, len: 2.5, tickets: [['General', 25, 150, 98], ['Student', 10, 30, 18]], summary: 'What three SaaS leaders learned changing prices on live customers.', body: ['A candid conversation with the people who actually ran the experiments — what moved revenue, what blew up support, and what they would never do again.', 'Drinks after, no badges, no lanyards.'], tags: ['saas', 'startups', 'pricing'], agenda: [['6:00 PM', 'Doors'], ['6:30 PM', 'Conversation'], ['7:30 PM', 'Audience questions'], ['8:00 PM', 'Drinks']] },
  { title: 'Founders Breakfast: hiring your first ten', org: 'o-founders', cat: 'business', city: 'New York', venue: ['Ludlow House', '139 Ludlow St, New York, NY'], day: 15, hour: 8, len: 1.5, tickets: [['Seat', 35, 40, 26]], summary: 'Coffee, eggs and hard-won advice on early hiring.', body: ['A small-format breakfast for founders between seed and Series A.'], tags: ['hiring', 'breakfast'] },
  { title: 'Full Moon Sound Bath', org: 'o-stillwater', cat: 'health', city: 'Los Angeles', venue: ['Stillwater Studio', '3122 Glendale Blvd, Los Angeles, CA'], day: 8, hour: 20, len: 1.5, tickets: [['Mat', 40, 30, 27]], summary: 'Crystal bowls, gongs and a long rest. Bring a blanket.', body: ['Ninety minutes on your back while we play. You do not need to do anything; falling asleep is allowed and common.'], tags: ['sound bath', 'meditation'], refund: '1day' },
  { title: 'Slow Flow Sunday', org: 'o-stillwater', cat: 'health', city: 'Los Angeles', venue: ['Stillwater Studio', '3122 Glendale Blvd, Los Angeles, CA'], day: 6, hour: 10, len: 1.25, tickets: [['Drop-in', 25, 25, 11]], summary: 'Gentle yoga for stiff bodies and busy minds.', body: ['All levels. Mats available to borrow.'], tags: ['yoga'] },
  { title: 'Author Talk: Marisol Ortega on "Salt Year"', org: 'o-plotline', cat: 'community', city: 'Chicago', venue: ['Plotline Books', '1650 N Damen Ave, Chicago, IL'], day: 9, hour: 19, len: 1.5, tickets: [['Free entry', 0, 70, 52], ['Entry + signed hardcover', 30, 40, 23]], summary: 'Reading, conversation and signing with the author of this year’s quiet hit.', body: ['Marisol reads from Salt Year and talks with our manager about writing grief without sentiment.', 'Books available at the counter if you did not pre-order.'], tags: ['books', 'reading'] },
  { title: 'The Argument: a book club', org: 'o-plotline', cat: 'community', city: 'Chicago', venue: ['Plotline Books', '1650 N Damen Ave, Chicago, IL'], day: 21, hour: 19, len: 2, tickets: [['Seat', 5, 25, 14]], summary: 'This month: a novel half of us loved and half of us threw across the room.', body: ['Bring opinions. Wine is five dollars and goes toward the next month’s pick.'], tags: ['book club'] },
  { title: 'Nachtwerk: 12 Hours', org: 'o-nachtwerk', cat: 'nightlife', city: 'Berlin', venue: ['Nachtwerk', 'Revaler Str. 99, Berlin'], day: 5, hour: 23, len: 12, tickets: [['Early entry', 18, 400, 400], ['Standard', 25, 600, 322]], summary: 'Three rooms, eleven artists, one very long night.', body: ['Our quarterly marathon. Main room runs until noon; the garden opens at sunrise.', 'No photos on the dancefloor — stickers on cameras at the door.'], tags: ['techno', 'house', 'club'], age: '18+', refund: 'none' },
  { title: 'Sunday Garden Session', org: 'o-nachtwerk', cat: 'nightlife', city: 'Berlin', venue: ['Nachtwerk Garden', 'Revaler Str. 99, Berlin'], day: 13, hour: 14, len: 8, tickets: [['Entry', 12, 500, 144]], summary: 'Disco and slow house outdoors. Family-friendly until 6pm.', body: ['Daytime party in the garden with food trucks and plenty of shade.'], tags: ['disco', 'daytime'] },
  { title: 'Accessible Forms, Properly', org: 'o-openweb', cat: 'tech', city: 'Online', day: 4, hour: 16, len: 2, tickets: [['Free seat', 0, 500, 388], ['Workshop + recording', 15, 200, 61]], summary: 'Labels, errors, focus and the screen reader testing you keep skipping.', body: ['A practical workshop. We build one sign-up form from scratch and test it with VoiceOver and NVDA as we go.', 'Recording and code sent to paid seats within 24 hours.'], tags: ['accessibility', 'html', 'workshop'] },
  { title: 'Design Tokens Without Tears', org: 'o-openweb', cat: 'tech', city: 'Online', day: 16, hour: 16, len: 1.5, tickets: [['Free', 0, 800, 120]], summary: 'Naming, theming and shipping tokens across three platforms.', body: ['How a small team runs one token source for web, iOS and Android, and what they would do differently.'], tags: ['design systems', 'css'] },
  { title: 'Speed Friending for Newcomers', org: 'o-founders', cat: 'dating', city: 'New York', venue: ['The Commons', '388 Atlantic Ave, Brooklyn, NY'], day: 11, hour: 19, len: 2, tickets: [['Ticket', 20, 60, 37]], summary: 'New to the city? Meet thirty people in ninety minutes, no pressure.', body: ['Not a dating event, despite the category. Structured rounds, good questions, and a group dinner after for anyone who wants it.'], tags: ['social', 'newcomers'] },
  { title: 'Singles Supper: Pasta Night', org: 'o-saltfat', cat: 'dating', city: 'Chicago', venue: ['Fulton Street Loft', '1132 W Fulton St, Chicago, IL'], day: 17, hour: 19, len: 3, tickets: [['Seat', 70, 30, 30]], summary: 'Hand-rolled pasta, assigned seats, and a seating swap at dessert.', body: ['Thirty singles, three courses. Ages 28–40.'], tags: ['singles', 'dinner'], age: '28–40' },
  { title: 'Halloween Cult Classics Double Bill', org: 'o-reelhouse', cat: 'holidays', city: 'Los Angeles', venue: ['Reelhouse Cinema', '1822 Sunset Blvd, Los Angeles, CA'], day: 5, hour: 20, len: 4, tickets: [['Double bill', 22, 90, 76]], summary: 'Two films, costume contest at intermission.', body: ['Come dressed. The best costume wins a year of free popcorn.'], tags: ['halloween', 'horror'], age: '18+' },
  { title: 'Winter Market & Mulled Wine', org: 'o-greenroom', cat: 'holidays', city: 'London', venue: ['Hackney Arches', '355 Mare St, London'], day: 34, hour: 12, len: 7, tickets: [['Free entry', 0, 2000, 260]], summary: 'Forty makers, hot food, carols from a pub choir.', body: ['Our annual fundraiser. Every stall is independent, every pound helps the theatre.'], tags: ['market', 'christmas'] },
  { title: 'Rooftop Salsa Social', org: 'o-eastside', cat: 'nightlife', city: 'Austin', venue: ['Hotel Magdalena Rooftop', '1101 Music Ln, Austin, TX'], day: 2, hour: 20, len: 3, tickets: [['Lesson + social', 18, 80, 45]], summary: 'Beginner lesson at 8, social dancing until 11.', body: ['No partner needed — we rotate. Flat shoes recommended.'], tags: ['dance', 'salsa'], age: '21+' },
  { title: 'Austin Songwriters in the Round', org: 'o-lowtide', cat: 'music', city: 'Austin', venue: ['The Little Gem', '1914 E 6th St, Austin, TX'], day: 10, hour: 19, len: 2.5, tickets: [['General', 15, 70, 52]], summary: 'Four songwriters, four stools, stories between every song.', body: ['A listening room show. Please keep conversation for the bar.'], tags: ['songwriters', 'acoustic'] },
  { title: 'Toronto Night Market Food Crawl', org: 'o-saltfat', cat: 'food-drink', city: 'Toronto', venue: ['Kensington Market', 'Augusta Ave, Toronto, ON'], day: 8, hour: 18, len: 3, tickets: [['Crawl pass', 45, 50, 30]], summary: 'Seven stops, seven bites, one guide who knows every owner.', body: ['A walking tour of Kensington’s best late-night food. Come hungry, wear comfy shoes.'], tags: ['food tour', 'walking'] },
  { title: 'Natural Wine 101', org: 'o-saltfat', cat: 'food-drink', city: 'New York', venue: ['Bottle Shop Back Room', '214 Bedford Ave, Brooklyn, NY'], day: 1, hour: 19, len: 2, tickets: [['Tasting seat', 55, 24, 20]], summary: 'Six bottles, one sommelier who will not make you feel silly.', body: ['We taste through skin contact, pét-nat and a couple of weird ones, with cheese.'], tags: ['wine', 'tasting'], age: '21+' },
  { title: 'Bay Area Climate Tech Mixer', org: 'o-buildnight', cat: 'business', city: 'San Francisco', venue: ['Fort Mason Pavilion', '2 Marina Blvd, San Francisco, CA'], day: 13, hour: 17, len: 3, tickets: [['General', 20, 250, 133], ['Startup table', 150, 15, 9]], summary: 'Founders, engineers and investors working on decarbonisation.', body: ['Short lightning talks then a long mixer. Startup tables include a two-minute slot on stage.'], tags: ['climate', 'networking'] },
  { title: 'Golden Gate Park Photo Walk', org: 'o-buildnight', cat: 'hobbies', city: 'San Francisco', venue: ['Conservatory of Flowers', '100 John F Kennedy Dr, San Francisco, CA'], day: 6, hour: 9, len: 2.5, tickets: [['Free', 0, 40, 18]], summary: 'Any camera, any level. We stop for coffee halfway.', body: ['A slow walk through the park with a working photographer. Phones absolutely count.'], tags: ['photography', 'outdoors'] },
  { title: 'Open Studio Life Drawing', org: 'o-greenroom', cat: 'performing-arts', city: 'Toronto', venue: ['The Drawing Room', '401 Richmond St W, Toronto, ON'], day: 4, hour: 19, len: 2, tickets: [['Drop-in', 20, 25, 13]], summary: 'Untutored session with short and long poses. Easels provided.', body: ['Bring your own paper and pencils, or buy a pad at the door.'], tags: ['drawing', 'art'], age: '18+' },
  { title: 'Berlin Startup Breakfast', org: 'o-founders', cat: 'business', city: 'Berlin', venue: ['Factory Görlitzer Park', 'Lohmühlenstr. 65, Berlin'], day: 12, hour: 8, len: 2, tickets: [['Free', 0, 120, 70]], summary: 'Coffee and a frank talk about raising in Europe this year.', body: ['Monthly breakfast for founders and early employees.'], tags: ['startups', 'fundraising'] },
  { title: 'Chicago Lakefront Bootcamp', org: 'o-eastside', cat: 'sports', city: 'Chicago', venue: ['Montrose Beach', '4400 N Simonds Dr, Chicago, IL'], day: 7, hour: 7, len: 1, tickets: [['Drop-in', 12, 40, 21]], summary: 'Forty-five minutes of sand sprints and bodyweight circuits.', body: ['Bring water and a towel. We go in light rain.'], tags: ['fitness', 'outdoors'] },
  { title: 'London Board Game Café Night', org: 'o-greenroom', cat: 'hobbies', city: 'London', venue: ['Draughts Waterloo', '41 Hercules Rd, London'], day: 2, hour: 18, len: 4, tickets: [['Table fee', 8, 60, 33]], summary: '800 games, staff who will teach you any of them.', body: ['Come alone or bring a group; we will find you a table.'], tags: ['board games', 'social'] },
  { title: 'Community Garden Volunteer Day', org: 'o-plotline', cat: 'community', city: 'Chicago', venue: ['Peterson Garden Project', '4642 N Francisco Ave, Chicago, IL'], day: 6, hour: 10, len: 3, tickets: [['Volunteer', 0, 50, 22]], summary: 'Put the beds to sleep for winter. Gloves and lunch provided.', body: ['Mulching, composting and planting garlic. Kids welcome with a guardian.'], tags: ['volunteering', 'gardening'] },
  { title: 'Documentary Night: "The Last Ferry"', org: 'o-reelhouse', cat: 'film', city: 'Online', day: 11, hour: 19, len: 2, tickets: [['Stream pass', 8, 1000, 210]], summary: 'Stream the film, then join the director live for Q&A.', body: ['A 70-minute documentary about the final season of a small island ferry. Link sent on purchase.'], tags: ['documentary', 'stream'] },
  { title: 'Breathwork for Better Sleep (Online)', org: 'o-stillwater', cat: 'health', city: 'Online', day: 1, hour: 21, len: 1, tickets: [['Free', 0, 500, 199]], summary: 'Thirty minutes of guided breathing, then lights out.', body: ['Join from bed. Cameras optional and discouraged.'], tags: ['sleep', 'breathwork'] },
  { title: 'Synth Building Workshop', org: 'o-nachtwerk', cat: 'classes', city: 'Berlin', venue: ['Nachtwerk Studio B', 'Revaler Str. 99, Berlin'], day: 19, hour: 12, len: 5, tickets: [['Workshop + kit', 140, 14, 6]], summary: 'Solder a monophonic synth from scratch and take it home.', body: ['No soldering experience needed. All tools and the kit are included.'], tags: ['electronics', 'diy', 'music'] },
  { title: 'Gospel Brunch', org: 'o-lowtide', cat: 'music', city: 'New York', venue: ['Red Rooster', '310 Lenox Ave, New York, NY'], day: 6, hour: 11, len: 2, tickets: [['Brunch + show', 65, 80, 74]], summary: 'A full choir and a full plate on a Sunday morning.', body: ['Seating is communal. Arrive fifteen minutes early.'], tags: ['gospel', 'brunch'] },
];

const PALETTE_COUNT = 10;

function buildEvents(): EventItem[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return seeds.map((s, i) => {
    const start = new Date(base.getTime() + s.day * 86400000);
    start.setHours(s.hour, s.hour === 7 || s.hour === 8 ? 0 : i % 3 === 0 ? 30 : 0);
    const end = new Date(start.getTime() + s.len * 3600000);
    const tickets: TicketType[] = s.tickets.map(([name, price, qty, sold], j) => ({
      id: `t-${i}-${j}`,
      name,
      price: price * 100,
      quantity: qty,
      sold,
      maxPerOrder: 10,
    }));
    const online = s.city === 'Online';
    return {
      id: `e-${(i + 101).toString(36)}${i}`,
      title: s.title,
      summary: s.summary,
      description: s.body.join('\n\n'),
      category: s.cat,
      tags: s.tags,
      organizerId: s.org,
      start: start.toISOString(),
      end: end.toISOString(),
      format: online ? 'online' : 'venue',
      venue: s.venue ? { name: s.venue[0], address: s.venue[1], city: s.city } : undefined,
      onlineUrl: online ? 'https://example.com/stream' : undefined,
      city: s.city,
      cover: { kind: 'poster', palette: (i * 7) % PALETTE_COUNT, pattern: i % 8 },
      tickets,
      promoCodes: i % 4 === 0 ? [{ code: 'FRIENDS10', percentOff: 10, uses: 3 }] : [],
      refundPolicy: s.refund ?? '7days',
      agenda: (s.agenda ?? []).map(([time, title]) => ({ time, title })),
      ageLimit: s.age,
      status: 'published',
      createdAt: new Date(base.getTime() - (30 - i) * 86400000).toISOString(),
      views: 200 + ((i * 137) % 1800),
    };
  });
}

export function createSeed(): DB {
  const demoUser = {
    id: 'u-demo',
    name: 'Sam Rivera',
    email: 'demo@ravers.test',
    passwordHash: hashPassword('demo1234'),
    city: 'New York',
    interests: ['music', 'food-drink', 'tech'] as CategoryId[],
    organizerId: 'o-demo',
    createdAt: new Date().toISOString(),
  };
  return {
    version: 1,
    events: buildEvents(),
    organizers: [
      ...organizers,
      { id: 'o-demo', name: 'Sam’s Events', city: 'New York', baseFollowers: 0, ownerUserId: 'u-demo', bio: 'Edit this profile from your organizer settings.' },
    ],
    users: [demoUser],
    orders: [],
    likes: {},
    follows: {},
    sessionUserId: null,
    city: 'New York',
  };
}
