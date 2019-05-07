<?php

 $events = [
    [
      id => 1,
      title => 'All Day Event',
      start => date('Y-m-d', mktime(0,0,0, date('m'), 2, date('Y'))),
      allDay => true,
      className => 'fc-event-primary'
    ], [
      id => 2,
      title => 'Long Event',
      start => date('Y-m-d', mktime(0,0,0, date('m'), 7, date('Y'))),
      end => date('Y-m-d', mktime(0,0,0, date('m'), 10, date('Y'))),
      className => 'fc-event-danger',
    ],[
      id => 3,
      title => 'Conference',
      start => date('Y-m-d', mktime(0,0,0, date('m'), 11, date('Y'))),
      end => date('Y-m-d', mktime(0,0,0, date('m'), 13, date('Y'))),
      className => 'fc-event-success',
    ],[
      id => 4,
      title => 'Meeting',
      start => date('Y-m-d h:i:s', mktime(10,30,00, date('m'), 18, date('Y'))),
      end => date('Y-m-d h:i:s', mktime(12,30,00, date('m'), 18, date('Y'))),
      className => 'fc-event-primary'
    ],[
      id => 5,
      title => 'Lunch',
      start => date('Y-m-d h:i:s', mktime(12,00,00, date('m'), 12, date('Y'))),
      className => 'fc-event-info'
    ],[
      id => 6,
      title => 'Meeting',
      start => date('Y-m-d h:i:s', mktime(14,30,00, date('m'), 12, date('Y'))),
      className => 'fc-event-warning'
    ],[
      id => 7,
      title => 'Dinner',
      start => date('Y-m-d h:i:s', mktime(20,00,00, date('m'), 12, date('Y'))),
      className => 'fc-event-danger'
    ],[
      id => 8,
      title => 'Birthday Party',
      start => date('Y-m-d h:i:s', mktime(17,00,00, date('m'), 14, date('Y'))),
      className => 'fc-event-success',
    ],[
      id => 9,
      title => 'Reporting',
      start => date('Y-m-d', mktime(0,0,0, date('m'), 27, date('Y'))),
      end => date('Y-m-d', mktime(0,0,0, date('m'), 29, date('Y'))),
      className => 'fc-event-warning',
    ],
];

print( json_encode($events) );

?>