-- Insert your original mock listings into the live database
insert into listings (price, type, area, phone, photo_urls) values
(180000, 'self-con', 'Akoka', '+2349012032050', array['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80']),
(250000, '1bedroom', 'Bariga', '+2349012032050', array['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80']),
(120000, 'shared', 'Yabatech GRA', '+2349012032050', array['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=600&q=80']);