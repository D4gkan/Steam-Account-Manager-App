-- Website actions require UUID-shaped identifiers, like accounts and profiles.
UPDATE websites SET id = substr(id,1,8)||'-'||substr(id,9,4)||'-'||substr(id,13,4)||'-'||substr(id,17,4)||'-'||substr(id,21,12) WHERE length(id)=32 AND id NOT GLOB '*[^0-9a-fA-F]*';
INSERT INTO schema_meta (key,value) VALUES ('005_normalize_website_ids','applied');
