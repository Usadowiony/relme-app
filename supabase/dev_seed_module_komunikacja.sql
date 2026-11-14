-- ============================================================
-- TYLKO NA CZAS TESTÓW: tworzy kompletny, NIEOPUBLIKOWANY moduł
-- „Komunikacja w związku”, który używa wszystkich 8 typów bloków
-- (19 widoków, większość typów kilka razy, w różnych wariantach).
--
-- Co powstaje:
--   modules        – nowy moduł (live_version_id = NULL, czyli nieopublikowany),
--   module_drafts  – szkic z pełnym flow_data (trigger modules_create_draft
--                    tworzy pusty szkic, skrypt go wypełnia).
-- Nie powstaje żadna wersja (module_versions): wersję zapisujesz i publikujesz
-- w panelu, po przejrzeniu modułu.
--
-- Ponowne uruchomienie: usuwa NIEOPUBLIKOWANY moduł o tym samym tytule
-- (razem ze szkicem i zapisanymi wersjami) i tworzy go od nowa. Jeśli moduł
-- o tym tytule był kiedykolwiek opublikowany, skrypt przerywa działanie
-- i niczego nie zmienia.
--
-- Treść przeszła walidację publikacji z relme-web (validateFlowContent)
-- i normalizeFlow nie zmienia w niej ani jednego pola.
--
-- Plan widoków:
--    1. knowledge-view – 6 elementów (heading, paragraph, image-text, section-title, list, callout)
--    2. exercise-poll – 5 odpowiedzi
--    3. knowledge-view – 9 elementów (heading, paragraph, section-title, list, callout)
--    4. knowledge-behavioral-contrast – 4+4 punktów, widżet: remember
--    5. exercise-quiz – 1 z 4 poprawnych, ilustracja: brak, widżet: remember
--    6. exercise-pattern-detector – 2 red + 2 green, widżet: info
--    7. exercise-thought-record – 3 kroki (3/4/3 odp.), podpowiedź: info
--    8. knowledge-behavioral-contrast – 3+3 punktów, widżet: brak
--    9. exercise-thought-record – 2 kroki (4/4 odp.), podpowiedź: brak
--   10. knowledge-view – 9 elementów (heading, paragraph, steps, section-title, chat-example, image-text, callout)
--   11. exercise-i-message – 4 kroki (3/3/3/3 odp.), podpowiedź: info
--   12. exercise-messenger – drzewo: głębokość 2, 5 zakończeń
--   13. exercise-poll – 6 odpowiedzi
--   14. exercise-quiz – 2 z 5 poprawnych, ilustracja: pusty slot, widżet: brak
--   15. exercise-pattern-detector – 3 red + 0 green, widżet: brak
--   16. exercise-messenger – drzewo: głębokość 3, 9 zakończeń
--   17. exercise-i-message – 4 kroki (4/3/3/4 odp.), podpowiedź: brak
--   18. exercise-quiz – 3 z 6 poprawnych, ilustracja: brak, widżet: remember
--   19. knowledge-view – 10 elementów (heading, paragraph, section-title, list, steps, chat-example, image-text, callout)
-- ============================================================

DO $seed$
DECLARE
  v_title constant text := 'Komunikacja w związku';
  v_module_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.modules m
     WHERE m.title = v_title
       AND (m.live_version_id IS NOT NULL
            OR EXISTS (SELECT 1 FROM public.module_versions v
                        WHERE v.module_id = m.id AND v.published_at IS NOT NULL))
  ) THEN
    RAISE EXCEPTION 'Moduł „%” był już opublikowany – skrypt testowy go nie nadpisze.', v_title;
  END IF;

  -- Poprzednia, nieopublikowana kopia testowa (kaskadowo: szkic i zapisane wersje).
  DELETE FROM public.modules WHERE title = v_title;

  INSERT INTO public.modules (title, description)
  VALUES (v_title, 'Naucz się rozmawiać o trudnych sprawach tak, by zbliżały, a nie oddalały. Poznasz czterech jeźdźców Gottmana, łagodny start rozmowy i komunikat JA.')
  RETURNING id INTO v_module_id;

  -- Szkic utworzony przez trigger modules_create_draft (na wszelki wypadek upsert).
  INSERT INTO public.module_drafts (module_id, flow_data, revision, updated_at)
  VALUES (v_module_id, $flow${
  "schema_version": 2,
  "views": [
    {
      "id": "11fac2d6-25b0-4765-b983-46ba1c9f2090",
      "block_type": "knowledge-view",
      "config": {
        "elements": [
          {
            "id": "a5bd5c23-2e83-4dda-8be0-ac0c7c1f9e2f",
            "type": "heading",
            "level": 1,
            "text": "Rozmowa, która {fioletowy}zbliża{/}"
          },
          {
            "id": "d11a0537-d928-46ec-a04d-44933aaf055f",
            "type": "paragraph",
            "text": "Większość konfliktów w związku nie wynika z tego, **o czym** rozmawiacie, tylko z tego, **jak** to robicie. Ten sam problem można omówić tak, że oboje poczujecie się wysłuchani, albo tak, że skończy się to cichymi dniami.\nW tym module poznasz sprawdzone sposoby, by mówić o trudnych sprawach {zielony}bez ranienia siebie nawzajem{/}."
          },
          {
            "id": "0f98632d-64f3-4c67-8be8-b080795f8919",
            "type": "image-text",
            "image_side": "left",
            "image": {
              "media_id": null
            },
            "text": "Badania Johna Gottmana pokazują, że o przebiegu trudnej rozmowy w dużej mierze decydują jej **pierwsze 3 minuty**."
          },
          {
            "id": "fd512eae-ec5b-48b4-bae3-614c8d6b49bc",
            "type": "section-title",
            "icon": "question",
            "text": "Czego się nauczysz?"
          },
          {
            "id": "9a0e0d60-56ba-4d9e-a6ab-a27eb3c222f2",
            "type": "list",
            "marker": "dot",
            "items": [
              "Rozpoznawać 4 style komunikacji, które niszczą bliskość",
              "Zaczynać trudne rozmowy łagodnie, bez oskarżeń",
              "Odróżniać fakty od własnych interpretacji",
              "Budować komunikat JA krok po kroku"
            ]
          },
          {
            "id": "67a27312-0897-481c-8d63-49a592e77763",
            "type": "callout",
            "variant": "info",
            "text": "Nie musisz od razu robić wszystkiego idealnie. **Wystarczy jedna zmiana** w sposobie mówienia, żeby rozmowa potoczyła się inaczej."
          }
        ]
      }
    },
    {
      "id": "db184902-37f0-4c87-9086-57c5ea98153c",
      "block_type": "exercise-poll",
      "config": {
        "question": "Co najczęściej robisz, gdy w związku pojawia się napięcie?",
        "options": [
          {
            "id": "bdfd9c7d-1931-4e25-bc0f-d3e4084d6c94",
            "text": "Od razu mówię, co mi przeszkadza"
          },
          {
            "id": "a152b41f-1452-4426-a693-8c60b6967242",
            "text": "Czekam, aż emocje opadną, i wracam do tematu"
          },
          {
            "id": "e7638ccc-27ed-4777-a22e-984b40d30df4",
            "text": "Unikam tematu, żeby nie robić kłótni"
          },
          {
            "id": "71b2b3f3-7499-43d9-a866-31723b375c2d",
            "text": "Wycofuję się i milknę"
          },
          {
            "id": "3a13a8c9-bd2a-4083-8ca8-25a8d8e7e087",
            "text": "Żartuję, żeby rozładować atmosferę"
          }
        ]
      }
    },
    {
      "id": "ce543d45-a8d8-4eef-abd1-639d714f1f09",
      "block_type": "knowledge-view",
      "config": {
        "elements": [
          {
            "id": "8f280ae8-0cae-49a6-8e49-a322ee46b133",
            "type": "heading",
            "level": 1,
            "text": "Czterej jeźdźcy, którzy {czerwony}niszczą{/} rozmowę"
          },
          {
            "id": "467b14a1-07c1-41bd-8324-8d13aa541565",
            "type": "paragraph",
            "text": "John Gottman przez ponad 40 lat obserwował pary w swoim laboratorium. Wyróżnił cztery style komunikacji, które najsilniej zapowiadają rozpad związku. Nazwał je **czterema jeźdźcami Apokalipsy**."
          },
          {
            "id": "2a531c3a-5732-4e3c-a878-b2cc6d36937a",
            "type": "section-title",
            "icon": "wrong",
            "text": "Na co uważać?"
          },
          {
            "id": "68c1b747-f408-4e62-be89-0dd610fe5921",
            "type": "list",
            "marker": "cross",
            "items": [
              "Krytyka – atak na charakter zamiast na zachowanie",
              "Pogarda – sarkazm, przewracanie oczami, wyśmiewanie",
              "Defensywność – tłumaczenie się i odbijanie piłeczki",
              "Mur milczenia – wycofanie się i ignorowanie rozmowy"
            ]
          },
          {
            "id": "42373d7e-d60a-47ae-9f06-7d65b9c0d6ce",
            "type": "section-title",
            "icon": "good",
            "text": "Co działa zamiast tego?"
          },
          {
            "id": "54e5f746-7f21-44a5-92e4-649c1c75541c",
            "type": "list",
            "marker": "check",
            "items": [
              "Łagodny start – mów o swoich uczuciach i potrzebach",
              "Kultura docenienia – zauważaj to, co dobre",
              "Branie odpowiedzialności – choćby za mały fragment problemu",
              "Przerwa na uspokojenie – 20 minut i powrót do rozmowy"
            ]
          },
          {
            "id": "d643c7b6-894e-40f1-8565-45d0ae9ab816",
            "type": "heading",
            "level": 2,
            "text": "Dlaczego pogarda jest najgroźniejsza?"
          },
          {
            "id": "2b55a30f-d24f-426c-b91b-148f0d51c27c",
            "type": "paragraph",
            "text": "Pogarda komunikuje: **stoję ponad Tobą**. Według Gottmana to najsilniejszy pojedynczy sygnał zbliżającego się rozstania – podkopuje szacunek, bez którego trudno o jakiekolwiek porozumienie."
          },
          {
            "id": "702ae64c-a5df-4de7-9617-a0be8043ff68",
            "type": "callout",
            "variant": "golden",
            "text": "W szczęśliwych związkach na jedną negatywną interakcję przypada **co najmniej pięć pozytywnych**. Dbaj o ten bilans także w zwykłe, spokojne dni."
          }
        ]
      }
    },
    {
      "id": "80c826f5-01a5-4a67-b76e-b028a7bd5f17",
      "block_type": "knowledge-behavioral-contrast",
      "config": {
        "kicker": "Szybkie przypomnienie:",
        "headline": "Gdy coś Ci przeszkadza, zacznij rozmowę łagodnie – sposób rozpoczęcia decyduje o tym, jak się skończy.",
        "avoid": {
          "title": "Zamiast",
          "lead": "Zaczynać od krytyki, czyli:",
          "points": [
            "Mówić „Ty nigdy…” albo „Ty zawsze…”",
            "Oceniać całą osobę: „Nie da się z Tobą normalnie porozmawiać”",
            "Wyciągać stare sprawy sprzed miesięcy",
            "Zaczynać rozmowę w złości, w biegu albo przy innych"
          ]
        },
        "focus": {
          "title": "Skup się na",
          "lead": "Łagodnym starcie, czyli:",
          "points": [
            "Mówieniu o sobie: „Czuję…”, „Potrzebuję…”",
            "Opisaniu jednej, konkretnej sytuacji",
            "Wybraniu spokojnego momentu na rozmowę",
            "Zakończeniu prośbą, a nie zarzutem"
          ]
        },
        "remember": {
          "variant": "remember",
          "text": "Rozmowy, które zaczynają się ostro, w **96% przypadków** kończą się tak samo – tak wynika z obserwacji Gottmana. Pierwsze zdanie naprawdę ma znaczenie."
        }
      }
    },
    {
      "id": "5b3ed0f8-df0c-469e-bf39-f3195b736af9",
      "block_type": "exercise-quiz",
      "config": {
        "instruction": "Zaznacz prawidłową odpowiedź.",
        "question": "Które zdanie jest przykładem łagodnego startu rozmowy?",
        "image": null,
        "options": [
          {
            "id": "7cd5c301-de3b-42b0-9c81-51763112c797",
            "text": "Znowu zostawiasz naczynia. Ty po prostu masz mnie gdzieś.",
            "is_correct": false,
            "explanation": "To krytyka połączona z uogólnieniem. Słowo „znowu” i ocena intencji („masz mnie gdzieś”) sprawiają, że druga strona zaczyna się bronić, zamiast słuchać."
          },
          {
            "id": "415309a6-7230-4da6-b255-0f752ba31763",
            "text": "Czuję zmęczenie, gdy wieczorem zlew jest pełen naczyń. Ustalmy, kto zmywa w które dni?",
            "is_correct": true,
            "explanation": "Zdanie opisuje konkretną sytuację, mówi o uczuciu nadawcy i kończy się propozycją wspólnego rozwiązania. Nie ma w nim oceny ani oskarżenia."
          },
          {
            "id": "0e8a415e-2cfb-4939-a536-7f15b9eeb54a",
            "text": "Nie chcę się kłócić, ale chyba wiesz, o co mi chodzi.",
            "is_correct": false,
            "explanation": "To komunikat niejasny i z ukrytym zarzutem. Druga osoba musi zgadywać, o co chodzi, a „nie chcę się kłócić, ale…” zwykle zapowiada właśnie kłótnię."
          },
          {
            "id": "7bb7b43c-c6d5-40f0-95d5-4650fad6cf6c",
            "text": "Wszyscy znajomi pomagają w domu, tylko Ty nie.",
            "is_correct": false,
            "explanation": "Porównywanie z innymi to forma krytyki. Wywołuje wstyd i chęć obrony, a nie motywację do zmiany."
          }
        ],
        "remember": {
          "variant": "remember",
          "text": "Łagodny start = **konkretna sytuacja + Twoje uczucie + prośba**. Bez ocen i bez słów „zawsze” i „nigdy”."
        }
      }
    },
    {
      "id": "8f30a69d-4b9c-425d-a1fe-8f76b64a0e3b",
      "block_type": "exercise-pattern-detector",
      "config": {
        "title": "Detektyw wzorców",
        "subtitle": "Zaznacz fragmenty wypowiedzi, które mogą być sygnałami ostrzegawczymi lub zielonymi flagami.",
        "text": "Kiedy rozmawiamy o pieniądzach, mój partner od razu mówi, że jestem rozrzutna i zawsze wszystko psuję. Ostatnio jednak zaproponował, żebyśmy usiedli razem w niedzielę i spokojnie zrobili budżet. Gdy próbuję wytłumaczyć swój punkt widzenia, przewraca oczami i rzuca: „No jasne, ekspertka się znalazła”. Doceniam za to, że przyznał, że część wydatków z zeszłego miesiąca to jego decyzje.",
        "flags": [
          {
            "id": "4a8a346c-5592-4a29-a4bd-39d30ae9a3a6",
            "kind": "red",
            "start": 52,
            "end": 102,
            "title": "Krytyka i uogólnienie",
            "explanation": "Zamiast odnieść się do konkretnego wydatku, partner ocenia cały charakter („rozrzutna”) i używa słowa „zawsze”. To pierwszy z jeźdźców Gottmana – krytyka, która wywołuje obronę zamiast rozmowy."
          },
          {
            "id": "bace20c1-3029-45d8-9359-5ef7bc44cac9",
            "kind": "green",
            "start": 119,
            "end": 194,
            "title": "Zaproszenie do współpracy",
            "explanation": "Propozycja konkretnego terminu i wspólnego działania przenosi rozmowę z oskarżeń na rozwiązanie. To sygnał, że obu stronom zależy na porozumieniu."
          },
          {
            "id": "602520e9-e720-44ec-b483-da46d72479a5",
            "kind": "red",
            "start": 240,
            "end": 301,
            "title": "Pogarda",
            "explanation": "Przewracanie oczami i sarkazm to klasyczne przejawy pogardy – najgroźniejszego z czterech jeźdźców. Komunikują wyższość i odbierają drugiej osobie poczucie, że jej zdanie ma znaczenie."
          },
          {
            "id": "58b53585-292b-462f-b2ea-1f4c0292cec7",
            "kind": "green",
            "start": 321,
            "end": 385,
            "title": "Branie odpowiedzialności",
            "explanation": "Przyznanie się do swojej części problemu to antidotum na defensywność. Rozbraja napięcie i pokazuje, że nie chodzi o wygraną, tylko o wspólne rozwiązanie."
          }
        ],
        "result": {
          "title": "Analiza wykrytych sygnałów",
          "body": "W tej wypowiedzi przeplatają się zachowania, które ranią, i takie, które budują porozumienie. Zobacz, co oznacza każde z nich."
        },
        "conclusion": {
          "title": "Czas na wnioski",
          "body": "Ten sam związek może zawierać zarówno red, jak i green flagi. Nie chodzi o szukanie idealnej osoby, tylko o zauważanie szkodliwych wzorców i wzmacnianie dobrych. Pogarda i krytyka to sygnały, o których warto szczerze porozmawiać – najlepiej w spokojnym momencie."
        },
        "remember": {
          "variant": "info",
          "text": "Jedna red flaga nie przekreśla związku, ale **powtarzająca się pogarda** to sygnał, by poszukać wsparcia – na przykład u terapeuty par."
        }
      }
    },
    {
      "id": "c557ab9f-bdcc-4fdb-b654-8260ae7d10c4",
      "block_type": "exercise-thought-record",
      "config": {
        "situation": "Wieczorem wysyłasz bliskiej osobie długą wiadomość o swoim trudnym dniu. Po godzinie widzisz, że wiadomość została odczytana, ale odpowiedzi wciąż nie ma.",
        "hint": {
          "variant": "info",
          "text": "Zanim zareagujesz, oddziel to, **co się wydarzyło**, od tego, **co sobie o tym myślisz**. To dwie zupełnie różne rzeczy."
        },
        "steps": [
          {
            "id": "9dfbd297-505b-4a61-95fe-2c02d1f69bc2",
            "title": "Oddziel fakt od interpretacji",
            "subtitle": "Co tak naprawdę się wydarzyło?",
            "options": [
              {
                "id": "230467b5-9c7c-41ac-a317-739b50189c38",
                "label": "Wiadomość została odczytana, ale nie ma jeszcze odpowiedzi.",
                "description": "Sam opis zdarzenia, bez dopowiadania.",
                "is_correct": true,
                "explanation": "Dokładnie tak. To jedyna rzecz, którą wiesz na pewno. Wszystko inne to przypuszczenia, które mogą, ale nie muszą być prawdą."
              },
              {
                "id": "e5836674-5da3-4754-92c6-5810f01a43c8",
                "label": "Bliska osoba mnie ignoruje.",
                "description": "",
                "is_correct": false,
                "explanation": "To już interpretacja, a nie fakt. Nie wiesz, dlaczego nie ma odpowiedzi – ktoś może prowadzić samochód, zasnąć albo potrzebować czasu, żeby odpisać spokojnie."
              },
              {
                "id": "e61aaf53-9d7b-4227-af7d-3e3533c0b52c",
                "label": "Moje sprawy nikogo nie obchodzą.",
                "description": "",
                "is_correct": false,
                "explanation": "To uogólnienie i ocena, które wynikają z emocji, a nie z tego, co się wydarzyło. Takie myślenie wzmacnia przykrość, zamiast pomóc zrozumieć sytuację."
              }
            ]
          },
          {
            "id": "45558112-b711-4914-9601-887821628285",
            "title": "Nazwij automatyczną myśl",
            "subtitle": "Która myśl najpewniej napędza Twoje emocje?",
            "options": [
              {
                "id": "d2a864b2-3999-4406-af46-f090ef48f565",
                "label": "„Brak odpowiedzi to dowód, że moje sprawy się nie liczą”",
                "description": "Myśl, która wyciąga daleko idący wniosek z jednego zdarzenia.",
                "is_correct": true,
                "explanation": "Tak – to typowa automatyczna myśl. Pojawia się błyskawicznie i wydaje się prawdziwa, choć opiera się na zgadywaniu. To ona, a nie samo zdarzenie, wywołuje smutek i złość."
              },
              {
                "id": "16e912ed-f04a-4feb-9ad9-8fa5dd32391c",
                "label": "„Pewnie zaraz przyjdzie odpowiedź”",
                "description": "",
                "is_correct": false,
                "explanation": "Taka myśl raczej uspokaja, niż wywołuje przykre emocje. W tym kroku szukamy myśli, która stoi za Twoją złością i smutkiem."
              },
              {
                "id": "1bb47b01-db0d-4ed7-b797-f89e8a1e178c",
                "label": "„Wieczorem łatwo przegapić wiadomość”",
                "description": "",
                "is_correct": false,
                "explanation": "To rozsądne, alternatywne wyjaśnienie – świetne na później. Ale to nie ono wywołało emocje; najpierw trzeba nazwać myśl, która je napędza."
              },
              {
                "id": "7027979d-aec4-4c49-95ff-639f8cb94798",
                "label": "„Nie mam dziś siły na rozmowy”",
                "description": "",
                "is_correct": false,
                "explanation": "Ta myśl dotyczy Twojego zmęczenia, a nie interpretacji braku odpowiedzi. Nie wyjaśnia, skąd bierze się przykrość w tej sytuacji."
              }
            ]
          },
          {
            "id": "b93740fb-d120-4a65-bc4a-df4c6b8f29c4",
            "title": "Wybierz zdrowszą reakcję",
            "subtitle": "Co pomoże Ci zadbać o siebie i o relację?",
            "options": [
              {
                "id": "688beb8d-7dd8-4936-9112-90739e2d93f2",
                "label": "Piszę: „Daj znać, kiedy znajdziesz chwilę – zależy mi na tej rozmowie”.",
                "description": "",
                "is_correct": true,
                "explanation": "To reakcja, która mówi o Twojej potrzebie bez oskarżeń. Zostawia drugiej osobie przestrzeń i jednocześnie jasno pokazuje, że ta rozmowa jest dla Ciebie ważna."
              },
              {
                "id": "44b520de-a122-477b-8c9c-33e2bf5ba2c3",
                "label": "Wysyłam: „Dzięki za zainteresowanie…” i wyłączam telefon.",
                "description": "Krótko i dobitnie.",
                "is_correct": false,
                "explanation": "Sarkazm i wycofanie to dwa z czterech jeźdźców naraz: pogarda i mur milczenia. Druga osoba poczuje atak, a Ty nadal nie dostaniesz wsparcia, którego potrzebujesz."
              },
              {
                "id": "2b8b41b8-d083-4383-8fdf-2a157def29b2",
                "label": "Nie odzywam się do jutra – niech druga strona też poczeka.",
                "description": "",
                "is_correct": false,
                "explanation": "Karanie milczeniem buduje dystans i uczy, że w Waszym związku zamiast rozmawiać, odpłaca się pięknym za nadobne. Problem pozostaje nierozwiązany."
              }
            ]
          }
        ],
        "success": {
          "result": {
            "title": "To była trafna analiza",
            "body": "Udało Ci się oddzielić fakty od interpretacji i wybrać reakcję, która chroni relację."
          },
          "explanation": {
            "title": "Dlaczego to działa?",
            "body": "Model ABC pokazuje, że emocje (C) nie wynikają bezpośrednio ze zdarzenia (A), tylko z naszych przekonań na jego temat (B). Kiedy zauważysz automatyczną myśl, możesz ją sprawdzić, zamiast od razu na niej działać.\nDzięki temu reagujesz na **to, co się naprawdę dzieje**, a nie na najczarniejszy scenariusz."
          },
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "Odczytana wiadomość bez odpowiedzi to jedna z najczęstszych pułapek współczesnych związków. Pamiętaj: **brak odpowiedzi to brak informacji**, a nie dowód na brak uczuć.",
            "remember": {
              "variant": "remember",
              "text": "Fakt → myśl → emocja. Gdy emocje rosną, **zatrzymaj się na etapie myśli** i zapytaj: „Skąd to wiem?”"
            }
          }
        },
        "failure": {
          "result": {
            "title": "To nie była odpowiednia analiza",
            "body": "Część Twoich wyborów opierała się na interpretacjach, a nie na faktach. Zobacz, co warto zrobić inaczej."
          },
          "explanation": {
            "title": "Wyjaśnienie",
            "body": "W sytuacjach pełnych emocji umysł błyskawicznie dopowiada historię: „ignoruje mnie”, „moje sprawy się nie liczą”. Te myśli wydają się faktami, ale nimi nie są.\nModel ABC pomaga to rozplątać: **A** to zdarzenie, **B** to Twoja myśl o nim, a **C** to emocje i zachowanie, które z tej myśli wynikają."
          },
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "Zanim zareagujesz na brak odpowiedzi, sprawdź, czy reagujesz na fakt, czy na własną interpretację. Ta jedna pauza chroni przed kłótnią, której mogło w ogóle nie być.",
            "remember": null,
            "reaction": {
              "title": "Jak powinna wyglądać reakcja?",
              "steps": [
                {
                  "title": "Fakt",
                  "text": "Wiadomość została odczytana, ale nie ma odpowiedzi."
                },
                {
                  "title": "Myśl",
                  "text": "„Moje sprawy się nie liczą” – to interpretacja, a nie fakt."
                },
                {
                  "title": "Sprawdzenie",
                  "text": "Co innego mogło się wydarzyć? Zmęczenie, praca, potrzeba czasu na spokojną odpowiedź."
                },
                {
                  "title": "Reakcja",
                  "text": "Spokojna wiadomość o swojej potrzebie zamiast sarkazmu lub milczenia."
                }
              ]
            },
            "reasons": {
              "title": "Dlaczego to działa?",
              "points": [
                "Oddzielasz zdarzenie od własnej opowieści o nim.",
                "Dajesz drugiej osobie szansę wyjaśnić sytuację.",
                "Mówisz o swojej potrzebie, zamiast karać milczeniem."
              ]
            }
          }
        }
      }
    },
    {
      "id": "2ff49261-34b0-48a8-87ce-ad542a3e580a",
      "block_type": "knowledge-behavioral-contrast",
      "config": {
        "kicker": "Zanim zaczniesz się bronić:",
        "headline": "Gdy słyszysz zarzut, nie musisz od razu się tłumaczyć – spróbuj najpierw usłyszeć, co jest pod nim.",
        "avoid": {
          "title": "Unikaj",
          "lead": "Reagowania defensywnie poprzez:",
          "points": [
            "Tłumaczenie się: „Ale to nie moja wina, bo…”",
            "Odbijanie piłeczki: „A Ty to niby lepiej?”",
            "Udawanie, że problemu nie ma"
          ]
        },
        "focus": {
          "title": "Postaw na",
          "lead": "Branie odpowiedzialności poprzez:",
          "points": [
            "Przyznanie racji choćby w części: „Masz rację, że…”",
            "Dopytanie: „Co było dla Ciebie w tym najtrudniejsze?”",
            "Zaproponowanie, co możesz zrobić inaczej"
          ]
        },
        "remember": null
      }
    },
    {
      "id": "55aa577c-0e8c-46ae-b86b-2d84ed230441",
      "block_type": "exercise-thought-record",
      "config": {
        "situation": "Podczas kolacji bliska osoba mówi z wyrzutem: „Znowu masz plany na sobotę bez nas. Ja się chyba w ogóle nie liczę”. Czujesz, jak rośnie w Tobie złość. Odruchowo chcesz odpowiedzieć: „To nieprawda, ciągle gdzieś razem wychodzimy!”",
        "hint": null,
        "steps": [
          {
            "id": "1c7ee28c-e4ac-444b-8b27-633bf65be92c",
            "title": "Rozpoznaj jeźdźca",
            "subtitle": "Jaki styl komunikacji kryje się w Twojej odruchowej odpowiedzi?",
            "options": [
              {
                "id": "42790ebb-33d1-4155-bed9-b83d2d0c200a",
                "label": "Defensywność",
                "description": "Tłumaczenie się i zaprzeczanie zarzutom.",
                "is_correct": true,
                "explanation": "Tak. Zaprzeczanie i kontrargument to typowa defensywność. Choć wydaje się naturalna, mówi drugiej osobie: „Twój problem nie jest prawdziwy”, przez co ona zaczyna mówić jeszcze głośniej."
              },
              {
                "id": "fc2b655e-88db-418b-94bf-4789c21ca477",
                "label": "Krytyka",
                "description": "Atak na charakter drugiej osoby.",
                "is_correct": false,
                "explanation": "Krytyka to atak na osobę („jesteś…”). Tutaj nie oceniasz charakteru drugiej strony, tylko bronisz siebie – to inny jeździec."
              },
              {
                "id": "7f7f4825-41b7-4bc7-956e-fd5d8c780f89",
                "label": "Pogarda",
                "description": "Sarkazm, kpina, poczucie wyższości.",
                "is_correct": false,
                "explanation": "W tej odpowiedzi nie ma kpiny ani sarkazmu. Pogarda brzmiałaby raczej: „Ależ oczywiście, biedactwo, nikt Cię nie zauważa”."
              },
              {
                "id": "f37a54bf-8606-4f90-b339-ded5e2a048b6",
                "label": "Mur milczenia",
                "description": "Wycofanie się z rozmowy.",
                "is_correct": false,
                "explanation": "Mur milczenia to wycofanie – wyjście z pokoju, cisza, wpatrywanie się w telefon. Ty jednak odpowiadasz, i to dość szybko."
              }
            ]
          },
          {
            "id": "64abb9d6-ea1d-46d9-93d2-5dcd771fadb4",
            "title": "Wybierz antidotum",
            "subtitle": "Która odpowiedź najlepiej zastąpi odruchową obronę?",
            "options": [
              {
                "id": "85ab9ae9-83cf-411f-93f2-691925a552b7",
                "label": "„Masz rację, ostatnio mało czasu spędzamy tylko we dwoje. Zaplanujmy coś.”",
                "description": "",
                "is_correct": true,
                "explanation": "To branie odpowiedzialności – antidotum na defensywność. Przyznajesz rację w tym, co prawdziwe, i od razu proponujesz rozwiązanie. Zarzut traci siłę, bo nie ma już z czym walczyć."
              },
              {
                "id": "6cc650f8-e032-488d-ac3f-f27cfc355489",
                "label": "„Przecież w zeszły weekend byliśmy w kinie.”",
                "description": "",
                "is_correct": false,
                "explanation": "To wciąż obrona – szukanie dowodów, że zarzut jest niesprawiedliwy. Nawet jeśli masz rację co do kina, druga osoba usłyszy, że jej uczucia się nie liczą."
              },
              {
                "id": "f2b2ead4-40b7-4fcc-8bd6-2b6ba83b78f2",
                "label": "„Dobrze, odwołam wszystko, skoro tak trzeba.”",
                "description": "",
                "is_correct": false,
                "explanation": "To uległość z nutą wyrzutu, a nie wzięcie odpowiedzialności. Problem nie zostaje omówiony, a w Tobie rośnie żal, który wróci przy kolejnej okazji."
              },
              {
                "id": "9b92e771-3227-43e3-bb5a-a398f7de9bac",
                "label": "„Nie będę o tym rozmawiać, kiedy tak się do mnie odzywasz.”",
                "description": "",
                "is_correct": false,
                "explanation": "Granica bywa potrzebna, ale tutaj zamyka rozmowę i zamienia się w mur milczenia. Lepiej najpierw odnieść się do uczucia, które stoi za zarzutem."
              }
            ]
          }
        ],
        "success": {
          "result": {
            "title": "Świetnie rozpoznany wzorzec",
            "body": "Udało Ci się zauważyć defensywność i zastąpić ją wzięciem odpowiedzialności."
          },
          "explanation": {
            "title": "Wyjaśnienie",
            "body": "Defensywność to najczęstszy z czterech jeźdźców – pojawia się niemal automatycznie, gdy czujemy się atakowani. Problem w tym, że **obrona eskaluje konflikt**: druga strona czuje, że jej nie słuchasz, więc mówi mocniej.\nAntidotum nie polega na przyznaniu się do wszystkiego, tylko na znalezieniu choćby małej części racji po drugiej stronie."
          },
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "Pod zarzutem „ja się nie liczę” zwykle kryje się tęsknota i potrzeba bliskości. Gdy odpowiesz na tę potrzebę, a nie na same słowa, rozmowa zmienia kierunek.",
            "remember": {
              "variant": "golden",
              "text": "Za każdym zarzutem stoi **niezaspokojona potrzeba**. Poszukaj jej, zanim zaczniesz się bronić."
            }
          }
        },
        "failure": {
          "result": {
            "title": "To nie była najlepsza reakcja",
            "body": "Twoje wybory wciąż utrzymywały rozmowę w trybie obrony. Sprawdź, jak można ją przekierować."
          },
          "explanation": {
            "title": "Wyjaśnienie",
            "body": "Gdy słyszymy zarzut, mózg traktuje go jak zagrożenie i uruchamia obronę. Zaprzeczanie, kontrargumenty czy wycofanie dają chwilową ulgę, ale **nie odpowiadają na to, co druga osoba naprawdę chce powiedzieć**."
          },
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "Zamiast udowadniać, że zarzut jest niesprawiedliwy, spróbuj usłyszeć uczucie, które za nim stoi. Wzięcie odpowiedzialności nawet za mały fragment problemu rozbraja konflikt szybciej niż najlepsze argumenty.",
            "remember": {
              "variant": "remember",
              "text": "Nie musisz zgadzać się ze wszystkim. Wystarczy **„Masz rację, że…”** w odniesieniu do jednej, prawdziwej rzeczy."
            },
            "reaction": {
              "title": "Jak powinna wyglądać reakcja?",
              "steps": [
                {
                  "title": "Zatrzymaj się",
                  "text": "Zauważ odruch obrony i weź jeden głęboki oddech."
                },
                {
                  "title": "Usłysz potrzebę",
                  "text": "Pod słowami „ja się nie liczę” kryje się potrzeba bliskości."
                },
                {
                  "title": "Przyznaj rację",
                  "text": "Odnieś się do tego, co prawdziwe: ostatnio macie mało czasu tylko we dwoje."
                }
              ]
            },
            "reasons": {
              "title": "Dlaczego to działa?",
              "points": [
                "Druga osoba czuje się wysłuchana, więc nie musi podnosić głosu.",
                "Rozmowa przechodzi od winy do wspólnego rozwiązania.",
                "Pokazujesz, że relacja jest ważniejsza niż racja.",
                "Obniżasz napięcie, zanim konflikt się rozkręci."
              ]
            }
          }
        }
      }
    },
    {
      "id": "9f53cbbc-8e8c-4567-a2b0-cbdc8360277e",
      "block_type": "knowledge-view",
      "config": {
        "elements": [
          {
            "id": "56130dda-854c-407f-b086-50d79ee3bafb",
            "type": "heading",
            "level": 1,
            "text": "Komunikat {turkusowy}JA{/} w czterech krokach"
          },
          {
            "id": "c7ee9969-0c1a-469d-bc90-67844fbf5b2c",
            "type": "paragraph",
            "text": "Komunikat JA to sposób mówienia o trudnych sprawach, który wywodzi się z **Porozumienia bez przemocy** Marshalla Rosenberga. Zamiast oceniać drugą osobę, mówisz o tym, co widzisz, czujesz i czego potrzebujesz."
          },
          {
            "id": "8be965c9-8a7c-4229-8285-9f96beb7a7f4",
            "type": "steps",
            "steps": [
              {
                "id": "13dc03a7-9444-406a-9ace-f9878133c015",
                "title": "Obserwacja",
                "text": "Opisz konkretne zachowanie tak, jak nagrałaby je kamera.\nBez ocen i bez słów „zawsze” czy „nigdy”."
              },
              {
                "id": "c3237fbd-33a3-4a44-b8f6-9dc99abcaec2",
                "title": "Uczucie",
                "text": "Nazwij swoją emocję: smutek, niepokój, złość, rozczarowanie."
              },
              {
                "id": "76d461a9-1500-4d8c-ae16-cc1683b5e14f",
                "title": "Potrzeba",
                "text": "Powiedz, jaka Twoja potrzeba stoi za tym uczuciem."
              },
              {
                "id": "e9dc8b1c-f0f5-4fd6-8139-b4cde83cb885",
                "title": "Prośba",
                "text": "Poproś o konkretne, możliwe do wykonania działanie."
              }
            ]
          },
          {
            "id": "fee1e575-c5ea-4ce7-bd65-61d697d7cf3f",
            "type": "section-title",
            "icon": "chat-good",
            "text": "Zobacz różnicę"
          },
          {
            "id": "ae27fb14-db6b-45ef-82c8-1b4e3e522c50",
            "type": "chat-example",
            "message": "Coś się stało? Od rana prawie się nie odzywasz.",
            "reply": "Bo Ty jak zwykle masz wszystko gdzieś. Nawet nie pamiętasz, co było wczoraj.",
            "verdict": "bad"
          },
          {
            "id": "8a87217c-2177-4cca-a918-6d04bb097208",
            "type": "chat-example",
            "message": "Coś się stało? Od rana prawie się nie odzywasz.",
            "reply": "Wczoraj przy znajomych rozmowa zeszła na moją pracę i zrobiło mi się przykro. Potrzebuję poczuć, że jesteśmy po jednej stronie. Pogadamy?",
            "verdict": "good"
          },
          {
            "id": "8b8398b6-9cc6-4f5f-8752-db9070bd5054",
            "type": "image-text",
            "image_side": "right",
            "image": {
              "media_id": null
            },
            "text": "Komunikat JA **nie gwarantuje**, że druga osoba spełni Twoją prośbę. Daje za to największą szansę, że {zielony}usłyszy Cię bez obrony{/}."
          },
          {
            "id": "aedf2dfa-0144-42a5-9787-4c6aa4340e56",
            "type": "callout",
            "variant": "remember",
            "text": "Komunikat TY: „**Ty** znowu się spóźniasz!”\nKomunikat JA: „Gdy czekam pół godziny, **czuję niepokój**. Potrzebuję przewidywalności.”"
          },
          {
            "id": "62d74895-c85c-4cbe-af6e-637b5f8cd1e1",
            "type": "paragraph",
            "text": "W kolejnym ćwiczeniu zbudujesz taki komunikat samodzielnie. {niebieski}Wybieraj odpowiedzi, które opisują fakty i uczucia, a nie oceny.{/}"
          }
        ]
      }
    },
    {
      "id": "a485ef21-4968-4d0f-bc46-b1b56489f94a",
      "block_type": "exercise-i-message",
      "config": {
        "context": {
          "title": "Kolejny odwołany wieczór",
          "body": "Od kilku tygodni to Ty organizujesz wszystkie wspólne wieczory. Bliska osoba właśnie pisze, że w piątek znowu nie da rady, bo ma inne plany."
        },
        "partner_message": "Sorki, w piątek jednak nie dam rady, mam już inne plany. Może kiedy indziej?",
        "hint": {
          "variant": "info",
          "text": "Komunikat JA zaczyna się od **obserwacji**, a nie od oceny. Szukaj odpowiedzi, które mogłaby nagrać kamera."
        },
        "steps": [
          {
            "id": "5a647cc4-5018-4077-a73e-5048a33e4940",
            "title": "Wybierz obserwację",
            "subtitle": "Jaki opis sytuacji przedstawia suchy fakt, bez ocen i uogólnień?",
            "options": [
              {
                "id": "19d2b9b0-03ba-488b-bc29-cfa9c6c384a6",
                "label": "Kiedy w ostatnim miesiącu trzy razy odwołujesz nasze wspólne plany…",
                "description": "Liczba i czas zamiast „zawsze”.",
                "is_correct": true,
                "explanation": "To czysty fakt: konkretna liczba, konkretny czas, bez oceny. Druga osoba nie ma z czym dyskutować, bo nie słyszy ataku."
              },
              {
                "id": "cd5bc0a1-2ef7-481a-9b29-b0e1fe830ace",
                "label": "Kiedy jak zwykle masz mnie gdzieś…",
                "description": "",
                "is_correct": false,
                "explanation": "„Jak zwykle” to uogólnienie, a „masz mnie gdzieś” to ocena intencji. Druga osoba natychmiast zacznie się bronić."
              },
              {
                "id": "be0e1bb0-df17-4f7b-ac42-bfde04ecedb8",
                "label": "Kiedy ciągle wybierasz innych zamiast mnie…",
                "description": "",
                "is_correct": false,
                "explanation": "Słowo „ciągle” przesadza, a całe zdanie zawiera interpretację. To krytyka ukryta w formie obserwacji."
              }
            ]
          },
          {
            "id": "bec6b0b3-7047-4e22-8e72-5563117501d6",
            "title": "Wybierz uczucie",
            "subtitle": "Które sformułowanie opisuje Twój stan emocjonalny, nie obwiniając drugiej strony?",
            "options": [
              {
                "id": "09426278-8332-465c-a1bf-5f0558b772c4",
                "label": "czuję smutek i rozczarowanie…",
                "description": "",
                "is_correct": true,
                "explanation": "Nazywasz własne emocje, nie obwiniając nikogo. Smutek i rozczarowanie są zrozumiałe i trudno się z nimi kłócić."
              },
              {
                "id": "fe31ded8-9031-4ace-9dea-2bbf57dadeaa",
                "label": "czuję, że kompletnie Cię nie obchodzę…",
                "description": "Brzmi jak uczucie, ale czy nim jest?",
                "is_correct": false,
                "explanation": "To nie jest uczucie, tylko myśl o drugiej osobie. Zdanie „czuję, że…” często ukrywa ocenę – prawdziwe uczucie to np. smutek albo samotność."
              },
              {
                "id": "2422f1a7-1c77-4b5c-8541-49144885bced",
                "label": "jest mi wszystko jedno…",
                "description": "",
                "is_correct": false,
                "explanation": "Gdyby tak było, ten temat w ogóle by nie wracał. Udawana obojętność zamyka rozmowę i odbiera drugiej osobie szansę, by zrozumieć, co się z Tobą dzieje."
              }
            ]
          },
          {
            "id": "577c7dbf-b740-4427-b72f-9fde088db503",
            "title": "Wybierz potrzebę",
            "subtitle": "Jaka Twoja uniwersalna potrzeba kryje się pod tymi emocjami?",
            "options": [
              {
                "id": "c613de30-3427-4681-afcb-f48408805879",
                "label": "bo zależy mi na wspólnym czasie i bliskości…",
                "description": "",
                "is_correct": true,
                "explanation": "Bliskość i wspólny czas to uniwersalne potrzeby. Mówiąc o nich, pokazujesz, co jest dla Ciebie ważne, zamiast wytykać, co druga osoba robi źle."
              },
              {
                "id": "fc761b89-ebed-4dc2-b234-91c84d2c89c8",
                "label": "bo należy mi się więcej uwagi…",
                "description": "",
                "is_correct": false,
                "explanation": "„Należy mi się” brzmi jak żądanie i stawia drugą osobę w roli dłużnika. Potrzeba jest prawdziwa, ale forma wywołuje opór."
              },
              {
                "id": "2ae860cb-bfb9-490b-91ee-fdebb81d2413",
                "label": "bo w innych związkach tak się nie robi…",
                "description": "",
                "is_correct": false,
                "explanation": "Porównywanie z innymi nie mówi nic o Twojej potrzebie, a wywołuje wstyd i złość. To krok w stronę krytyki."
              }
            ]
          },
          {
            "id": "db3802ae-a19e-411b-a9fa-66515885ab75",
            "title": "Wybierz prośbę",
            "subtitle": "O jakie konkretne, możliwe do wykonania działanie chcesz poprosić?",
            "options": [
              {
                "id": "702b3346-615d-4ae2-a5b1-e07537bde949",
                "label": "Czy możemy teraz ustalić jeden wieczór w tygodniu tylko dla nas?",
                "description": "",
                "is_correct": true,
                "explanation": "Prośba jest konkretna, dotyczy przyszłości i daje drugiej osobie realny wybór. Łatwo na nią odpowiedzieć „tak” albo zaproponować coś innego."
              },
              {
                "id": "05c15def-ecad-4d8c-a630-a2446ad46179",
                "label": "Masz się bardziej starać.",
                "description": "",
                "is_correct": false,
                "explanation": "To polecenie, a nie prośba – i do tego bardzo ogólne. Co dokładnie znaczy „bardziej się starać”? Druga osoba nie wie, co ma zrobić."
              },
              {
                "id": "254b97a8-5f6d-4e9a-964d-b578077bf6f8",
                "label": "Zastanów się nad sobą.",
                "description": "",
                "is_correct": false,
                "explanation": "To ukryty zarzut, który nie wskazuje żadnego działania. Zamiast zbliżyć, oddala i kończy rozmowę."
              }
            ]
          }
        ],
        "success": {
          "result": {
            "title": "To był dobry komunikat JA",
            "body": "Twoja wiadomość opisuje fakty, uczucia i potrzeby, a na końcu zawiera jasną prośbę."
          },
          "explanation": {
            "title": "Wyjaśnienie",
            "body": "Każdy z czterech elementów ma swoje zadanie: **obserwacja** mówi, o co chodzi, **uczucie** pokazuje, jak to na Ciebie wpływa, **potrzeba** wyjaśnia dlaczego, a **prośba** wskazuje drogę naprzód."
          },
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "Taki komunikat nie zostawia miejsca na zgadywanie i nie wywołuje obrony. Druga osoba wie dokładnie, co się dzieje i co może zrobić.",
            "remember": null
          }
        },
        "failure": {
          "result": {
            "title": "To nie był dobry komunikat JA",
            "body": "W Twojej wiadomości pojawiły się oceny lub żądania, które mogą wywołać obronę."
          },
          "explanation": {
            "title": "Wyjaśnienie",
            "body": "Najczęstsza pułapka to ukrywanie oceny pod przykrywką uczucia, np. „czuję, że Cię nie obchodzę”. Brzmi to jak mówienie o sobie, ale w rzeczywistości jest **zarzutem wobec drugiej osoby**.\nPrawdziwy komunikat JA opiera się na faktach i własnych emocjach."
          },
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "Sprawdzaj każdy element komunikatu: czy opisuje fakt, czy ocenę? Czy mówi o Tobie, czy o drugiej osobie? Ta jedna zmiana perspektywy sprawia, że rozmowa staje się bezpieczna dla obu stron.",
            "remember": {
              "variant": "info",
              "text": "Zdanie zaczynające się od „czuję, że…” to najczęściej **myśl**, a nie uczucie. Uczucia nazywamy jednym słowem: smutek, złość, lęk."
            },
            "better_title": "Tak mogła brzmieć Twoja odpowiedź",
            "reasons": {
              "title": "Dlaczego to działa?",
              "points": [
                "Opisuje fakt, z którym trudno dyskutować.",
                "Mówi o Twoich uczuciach, a nie o winie drugiej osoby.",
                "Kończy się konkretną prośbą, na którą łatwo odpowiedzieć."
              ]
            }
          }
        }
      }
    },
    {
      "id": "e3f4b81e-3e70-4f50-ae53-f463fa1cd788",
      "block_type": "exercise-messenger",
      "config": {
        "root": {
          "id": "9f5f63bd-0a35-4c5a-8271-c4fbe4af483f",
          "message": "Hej, wiem, że mieliśmy dziś iść do kina, ale strasznie boli mnie głowa. Możemy przełożyć?",
          "options": [
            {
              "id": "ad09cd4f-55d6-4da3-8aa9-4899b71a05b5",
              "text": "Jasne, szkoda, ale zdrowie najważniejsze. Może zamiast kina zrobię Ci herbatę i obejrzymy coś w domu?",
              "is_correct": true,
              "explanation": {
                "title": "Dlaczego to dobra odpowiedź?",
                "body": "Wyrażasz swoje rozczarowanie („szkoda”), ale stawiasz potrzebę drugiej osoby na pierwszym miejscu i proponujesz alternatywę. To przykład **zwracania się ku** – tak Gottman nazywa odpowiadanie na sygnały i prośby partnera.",
                "points": [],
                "widget": null
              },
              "next": {
                "id": "c004cee4-13fd-4624-8001-50ef3279facc",
                "message": "Byłoby super 🥰 Ale chyba nawet na film nie mam siły. Nie gniewasz się?",
                "options": [
                  {
                    "id": "c2a79c06-3298-4ca8-807d-01968e6adbbf",
                    "text": "Nie gniewam się. Odpocznij, a w weekend nadrobimy kino – trzymam Cię za słowo 😉",
                    "is_correct": true,
                    "explanation": {
                      "title": "Dlaczego to działa?",
                      "body": "Odpowiadasz wprost na pytanie o emocje i dajesz poczucie bezpieczeństwa. Jednocześnie wyrażasz potrzebę wspólnego czasu w lekki, nienaciskający sposób.",
                      "points": [
                        "Uspokajasz, że wszystko jest w porządku",
                        "Planujesz wspólny czas na przyszłość",
                        "Humor rozładowuje napięcie"
                      ],
                      "widget": {
                        "variant": "golden",
                        "text": "Odpowiedź na **ukryte pytanie** („czy między nami wszystko w porządku?”) jest często ważniejsza niż odpowiedź na samo pytanie."
                      }
                    },
                    "next": {
                      "id": "235563a4-5439-4568-98dc-c006dce5ae95",
                      "message": "Dziękuję ❤️ Dobrze, że Cię mam.",
                      "options": [],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "",
                          "reasons": [
                            "",
                            ""
                          ]
                        }
                      }
                    }
                  },
                  {
                    "id": "88db092a-3fa7-41d7-b43d-dd15fa4c1b5e",
                    "text": "Trochę się gniewam, zawsze coś wypada w ostatniej chwili.",
                    "is_correct": false,
                    "explanation": {
                      "title": "Na czym polegał błąd?",
                      "body": "Twoje rozczarowanie jest zrozumiałe, ale słowo „zawsze” zamienia jedną sytuację w zarzut wobec całego związku. Osoba, która źle się czuje, dostaje dodatkowo poczucie winy.",
                      "points": [
                        "Uogólnienie „zawsze” zamienia prośbę w krytykę",
                        "Choroba to nie jest dobry moment na rozliczenia"
                      ],
                      "widget": null
                    },
                    "next": {
                      "id": "75061fb9-980e-4d4b-a43f-255fa02ebbc3",
                      "message": "Przecież nie wybieram sobie, kiedy boli mnie głowa… Dobra, nieważne.",
                      "options": [],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "Kiedy ktoś źle się czuje, potrzebuje przede wszystkim zrozumienia. Twoje rozczarowanie jest ważne, ale lepiej porozmawiać o nim w spokojnym momencie, a nie wtedy, gdy druga osoba jest osłabiona.",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "Nie gniewam się, choć trochę mi szkoda. Odpocznij, a w weekend nadrobimy kino.",
                          "reasons": [
                            "Nazywasz swoje uczucie bez obwiniania.",
                            "Dajesz drugiej osobie poczucie bezpieczeństwa.",
                            "Proponujesz konkretny plan na przyszłość."
                          ]
                        }
                      }
                    }
                  },
                  {
                    "id": "3992f22b-4e1e-4c67-8359-af6a6c236acb",
                    "text": "Okej.",
                    "is_correct": false,
                    "explanation": {
                      "title": "Na czym polegał błąd?",
                      "body": "Jedno chłodne słowo zostawia drugą osobę z domysłami. Nie wiadomo, czy wszystko jest w porządku, czy właśnie zaczyna się ciche obrażanie – a to pierwsza cegła w murze milczenia.",
                      "points": [],
                      "widget": {
                        "variant": "info",
                        "text": "W wiadomościach tekstowych brakuje tonu głosu i mimiki. **Krótka odpowiedź** łatwo brzmi jak chłód, nawet jeśli tak nie jest."
                      }
                    },
                    "next": {
                      "id": "f0659ba2-6bd1-4c9a-bdb2-3c4341c4927f",
                      "message": "Okej…? Brzmisz, jakby jednak było Ci przykro.",
                      "options": [],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "Ucinając rozmowę, zostawiasz drugą osobę z niepewnością. Nawet jeśli nie chcesz robić problemu, warto powiedzieć wprost, co czujesz – krótko i życzliwie.",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "Nie gniewam się, trochę mi tylko szkoda. Kuruj się, nadrobimy w weekend ❤️",
                          "reasons": [
                            "Jasno mówisz, że wszystko jest w porządku.",
                            "Nie ukrywasz swoich emocji.",
                            "Okazujesz troskę."
                          ]
                        }
                      }
                    }
                  }
                ],
                "conclusion": {
                  "title": "Czas na wnioski",
                  "body": "",
                  "better": {
                    "title": "Jak możesz odpowiedzieć lepiej?",
                    "example": "",
                    "reasons": [
                      "",
                      ""
                    ]
                  }
                }
              }
            },
            {
              "id": "8115a4af-270d-40bd-b517-fa7c5796f468",
              "text": "Serio? Znowu? Zawsze coś Ci wypada, kiedy mamy plany.",
              "is_correct": false,
              "explanation": {
                "title": "Na czym polegał błąd?",
                "body": "To odpowiedź z krytyką i uogólnieniem. Druga osoba prosi o zrozumienie, a dostaje zarzut, że „zawsze” coś psuje. W takiej sytuacji trudno poczuć się bezpiecznie i szczerze rozmawiać.",
                "points": [
                  "„Znowu” i „zawsze” to uogólnienia",
                  "Zarzut zamiast troski o osobę, która źle się czuje",
                  "Ton wiadomości zaprasza do kłótni"
                ],
                "widget": {
                  "variant": "remember",
                  "text": "Gdy czujesz rozczarowanie, nazwij je wprost: **„Szkoda, bo bardzo czekam na ten wieczór”**. Zarzut tylko ukrywa prawdziwe uczucie."
                }
              },
              "next": {
                "id": "53606f5e-57f8-4da6-81c8-a938229661ea",
                "message": "Wow. Naprawdę myślisz, że udaję? Nie mam siły na tę rozmowę.",
                "options": [],
                "conclusion": {
                  "title": "Czas na wnioski",
                  "body": "Krytyka w chwili, gdy ktoś prosi o zrozumienie, niemal zawsze kończy się obroną lub wycofaniem. Twoje rozczarowanie jest w porządku, ale podane jako zarzut sprawia, że druga osoba słyszy tylko atak.",
                  "better": {
                    "title": "Jak możesz odpowiedzieć lepiej?",
                    "example": "Szkoda, bardzo czekam na ten film. Ale jasne, odpocznij – przełożymy na weekend?",
                    "reasons": [
                      "Wyrażasz rozczarowanie bez oskarżania.",
                      "Okazujesz troskę o samopoczucie drugiej osoby.",
                      "Proponujesz nowy termin zamiast rozliczeń.",
                      "Druga osoba nie musi się bronić."
                    ]
                  }
                }
              }
            },
            {
              "id": "006ef784-cf3f-42eb-8bf9-0c330e6e3b6e",
              "text": "Dobra, to pójdę z kimś innym.",
              "is_correct": false,
              "explanation": {
                "title": "Na czym polegał błąd?",
                "body": "Ta odpowiedź może brzmieć jak kara albo próba wzbudzenia zazdrości. Nawet jeśli nie masz złych intencji, druga osoba usłyszy, że wspólny plan nie był dla Ciebie wyjątkowy.",
                "points": [],
                "widget": null
              },
              "next": {
                "id": "22a6bfc4-d32f-4498-8346-dcd795688c97",
                "message": "Aha. No to baw się dobrze.",
                "options": [],
                "conclusion": {
                  "title": "Czas na wnioski",
                  "body": "Szybkie „to pójdę z kimś innym” zamyka temat, ale zostawia ranę. Druga osoba może poczuć się zastąpiona w chwili, gdy potrzebuje troski. Lepiej najpierw okazać zrozumienie, a dopiero potem szukać nowego planu.",
                  "better": {
                    "title": "Jak możesz odpowiedzieć lepiej?",
                    "example": "Jasne, kuruj się. Szkoda, ale nadrobimy – może w sobotę?",
                    "reasons": [
                      "Najpierw troska, potem plany.",
                      "Pokazujesz, że wspólny czas jest dla Ciebie ważny."
                    ]
                  }
                }
              }
            }
          ],
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "",
            "better": {
              "title": "Jak możesz odpowiedzieć lepiej?",
              "example": "",
              "reasons": [
                "",
                ""
              ]
            }
          }
        },
        "result": {
          "success": {
            "title": "To były dobre odpowiedzi",
            "body": "Udało Ci się pogodzić własne rozczarowanie z troską o drugą osobę. Zobacz, dlaczego to zadziałało."
          },
          "failure": {
            "title": "To nie były najlepsze odpowiedzi",
            "body": "Twoje emocje były zrozumiałe, ale sposób ich wyrażenia mógł zranić. Zobacz, co poszło nie tak."
          }
        }
      }
    },
    {
      "id": "45ee4521-97dc-4b17-9b06-f66165d972f9",
      "block_type": "exercise-poll",
      "config": {
        "question": "Co najbardziej utrudnia Ci szczere rozmowy w związku?",
        "options": [
          {
            "id": "f9050249-5ce9-4063-8eed-d9e3c2761bad",
            "text": "Strach przed kłótnią"
          },
          {
            "id": "5abcf751-1a77-4346-8cfa-147c19179e2e",
            "text": "Brak czasu i zmęczenie"
          },
          {
            "id": "1698a298-a410-4842-ae85-8e5574a7a293",
            "text": "Nie wiem, jak zacząć"
          },
          {
            "id": "79b7dc53-8ab4-440b-919b-1b470cf729ec",
            "text": "Obawa przed niezrozumieniem"
          },
          {
            "id": "8223bd38-26f4-40ce-8a64-6926852c4912",
            "text": "Trudno mi nazwać własne emocje"
          },
          {
            "id": "e5f7b020-8ded-47fa-88e8-67c0972c45fe",
            "text": "Wcześniejsze rozmowy kończyły się źle"
          }
        ]
      }
    },
    {
      "id": "99947436-eb3e-4808-bcab-a9e54f2a655a",
      "block_type": "exercise-quiz",
      "config": {
        "instruction": "Zaznacz prawidłowe odpowiedzi.",
        "question": "Które z poniższych zachowań to przejawy pogardy?",
        "image": {
          "media_id": null
        },
        "options": [
          {
            "id": "0617a2b4-80ce-40f1-b122-aa5d50b2dd5e",
            "text": "Przewracanie oczami, gdy druga osoba mówi",
            "is_correct": true,
            "explanation": "Tak. To niewerbalny sygnał wyższości – jeden z najbardziej charakterystycznych przejawów pogardy według Gottmana."
          },
          {
            "id": "5880a100-218d-4d16-bfaa-431b2cc1fc61",
            "text": "Sarkastyczne „No brawo, wielkie odkrycie”",
            "is_correct": true,
            "explanation": "Tak. Sarkazm i kpina komunikują: „uważam Cię za kogoś gorszego”. To pogarda podana w formie żartu."
          },
          {
            "id": "6811bed7-b2dc-4258-b06d-7cb0f529781e",
            "text": "Powiedzenie „Potrzebuję chwili przerwy”",
            "is_correct": false,
            "explanation": "To nie pogarda, tylko zdrowa przerwa na uspokojenie – antidotum na mur milczenia, o ile wrócisz do rozmowy."
          },
          {
            "id": "fdc7aabc-5c93-4fe8-83e7-4953ab674bed",
            "text": "Tłumaczenie się z zarzutu",
            "is_correct": false,
            "explanation": "To defensywność, a nie pogarda. Obrona dotyczy siebie, a pogarda – umniejszania drugiej osoby."
          },
          {
            "id": "2a2573aa-cb23-418d-ad84-f48e20cccb7f",
            "text": "Mówienie „Ty zawsze się spóźniasz”",
            "is_correct": false,
            "explanation": "To krytyka: uogólniony zarzut wobec drugiej osoby. Jest bolesna, ale nie zawiera tak silnego elementu wyższości jak pogarda."
          }
        ],
        "remember": null
      }
    },
    {
      "id": "7f1d302f-0262-46ac-9ab0-7dbd00fca2bc",
      "block_type": "exercise-pattern-detector",
      "config": {
        "title": "Wiadomość po kłótni",
        "subtitle": "Przeczytaj wiadomość wysłaną tuż po kłótni i zaznacz fragmenty, które są sygnałami ostrzegawczymi.",
        "text": "Nie chcę już o tym gadać. Dziś po pracy jadę do mamy pomóc jej z zakupami. Jak zwykle robisz z igły widły, kiedy tylko coś nie idzie po Twojej myśli. Ja przynajmniej coś planuję, a Ty tylko narzekasz. Wrócę około dziewiątej.",
        "flags": [
          {
            "id": "87bf3860-6fbd-4007-9157-f623be5a69d0",
            "kind": "red",
            "start": 0,
            "end": 25,
            "title": "Mur milczenia",
            "explanation": "Ucięcie rozmowy bez propozycji powrotu do tematu to wycofanie. Druga osoba zostaje sama z problemem i z poczuciem, że jej sprawy nie są ważne."
          },
          {
            "id": "d8973820-d04e-4604-9c07-f662d6470298",
            "kind": "red",
            "start": 75,
            "end": 149,
            "title": "Krytyka i umniejszanie",
            "explanation": "„Jak zwykle” uogólnia, a „robisz z igły widły” podważa uczucia drugiej osoby. To komunikat: Twój problem jest przesadzony – czyli atak na osobę, a nie rozmowa o sytuacji."
          },
          {
            "id": "d258e13c-6922-4ad5-b1c4-884df41d4331",
            "kind": "red",
            "start": 150,
            "end": 200,
            "title": "Odbijanie piłeczki",
            "explanation": "Zestawienie „ja się staram, a Ty tylko narzekasz” to klasyczna defensywność: zamiast odnieść się do problemu, przerzucasz winę na drugą stronę."
          }
        ],
        "result": {
          "title": "Analiza wykrytych sygnałów",
          "body": "Ta krótka wiadomość zawiera aż trzy sygnały ostrzegawcze. Każdy z nich osobno rani, a razem zamykają drogę do porozumienia."
        },
        "conclusion": {
          "title": "Czas na wnioski",
          "body": "Wiadomości pisane w złości często łączą kilka szkodliwych wzorców naraz. Zanim wyślesz coś po kłótni, przeczytaj to jeszcze raz i zapytaj siebie: czy to zdanie przybliża nas do rozwiązania, czy tylko rozładowuje moje emocje?"
        },
        "remember": null
      }
    },
    {
      "id": "fc207d68-7fd5-430e-a8fc-ced302e440f1",
      "block_type": "exercise-messenger",
      "config": {
        "root": {
          "id": "fdb16c2d-6dce-45a9-829a-07e563a9720b",
          "message": "Możemy pogadać? Mam wrażenie, że ostatnio przy kolacji bardziej rozmawiasz z telefonem niż ze mną.",
          "options": [
            {
              "id": "b1bd021d-a86e-495e-90cb-fe0e4fcb18d2",
              "text": "Dobrze, że o tym mówisz. Opowiesz mi, kiedy najbardziej to czujesz?",
              "is_correct": true,
              "explanation": {
                "title": "Dlaczego to dobra odpowiedź?",
                "body": "Zamiast się bronić, doceniasz szczerość i dopytujesz. To pokazuje, że **traktujesz problem poważnie** i chcesz go zrozumieć, zanim zaczniesz cokolwiek tłumaczyć.",
                "points": [
                  "Doceniasz odwagę drugiej osoby",
                  "Pytanie otwarte zaprasza do rozmowy"
                ],
                "widget": null
              },
              "next": {
                "id": "9d1f68d5-bed3-4f16-a728-04afbde5057f",
                "message": "Najbardziej wieczorami. Opowiadam o swoim dniu, a Ty tylko kiwasz głową i scrollujesz. Czuję się wtedy, jakby mnie nie było.",
                "options": [
                  {
                    "id": "79baceb1-b1c1-4a8c-aea4-4e104280cf26",
                    "text": "Przykro mi, że tak to wygląda. Masz rację, zdarza mi się odpływać w telefon, kiedy mówisz.",
                    "is_correct": true,
                    "explanation": {
                      "title": "Dlaczego to działa?",
                      "body": "Bierzesz odpowiedzialność za konkretne zachowanie i uznajesz uczucia drugiej osoby. Nie umniejszasz ich ani nie szukasz wymówek – to antidotum na defensywność.",
                      "points": [],
                      "widget": {
                        "variant": "remember",
                        "text": "**Uznanie uczuć** nie oznacza przyznania się do wszystkiego. Oznacza: „widzę, że to dla Ciebie trudne”."
                      }
                    },
                    "next": {
                      "id": "a02262f8-3650-45b0-babc-6a75936d4e80",
                      "message": "Dziękuję, że to mówisz. Nie chcę Ci zabraniać telefonu, po prostu tęsknię za naszymi rozmowami.",
                      "options": [
                        {
                          "id": "f8401253-4233-4bbf-9533-f97eb7489fca",
                          "text": "Ja też tęsknię. Co powiesz na kolacje bez telefonów? Odkładamy je oboje do szuflady.",
                          "is_correct": true,
                          "explanation": {
                            "title": "Dlaczego to działa?",
                            "body": "Odpowiadasz na emocję drugiej osoby i proponujesz konkretne, wspólne rozwiązanie. Słowo „oboje” sprawia, że nie jest to kara, tylko wspólna decyzja.",
                            "points": [
                              "Odwzajemniasz potrzebę bliskości",
                              "Proponujesz konkretną zmianę",
                              "Rozwiązanie dotyczy Was obojga"
                            ],
                            "widget": {
                              "variant": "golden",
                              "text": "Najlepsze rozwiązania konfliktów to te, które **obie strony traktują jako wspólne**, a nie jako ustępstwo."
                            }
                          },
                          "next": {
                            "id": "5063593e-a0dd-41ed-9d72-c4b32d7bdc66",
                            "message": "To świetny pomysł! Zaczynamy od dzisiaj 😊",
                            "options": [],
                            "conclusion": {
                              "title": "Czas na wnioski",
                              "body": "",
                              "better": {
                                "title": "Jak możesz odpowiedzieć lepiej?",
                                "example": "",
                                "reasons": [
                                  "",
                                  ""
                                ]
                              }
                            }
                          }
                        },
                        {
                          "id": "c6884e4e-cc90-43bc-885c-bb6e3df82453",
                          "text": "Okej, postaram się, ale nie obiecuję, bo czasem muszę odpisać z pracy.",
                          "is_correct": false,
                          "explanation": {
                            "title": "Na czym polegał błąd?",
                            "body": "Zastrzeżenie na końcu osłabia całą deklarację. Druga osoba słyszy głównie „nie obiecuję”, a nie chęć zmiany. Lepiej od razu ustalić, jak poradzić sobie z pilnymi sprawami z pracy.",
                            "points": [
                              "„Ale” przekreśla to, co było przed nim"
                            ],
                            "widget": null
                          },
                          "next": {
                            "id": "655ad6c2-788b-451b-8585-450a13a0dc14",
                            "message": "No dobrze… Czyli w sumie nic się nie zmieni.",
                            "options": [],
                            "conclusion": {
                              "title": "Czas na wnioski",
                              "body": "Dobra wola z zastrzeżeniem brzmi jak brak zaangażowania. Jeśli naprawdę bywają sytuacje, w których musisz odpisać, powiedz o tym wprost i zaproponuj zasadę, która zadziała dla Was obojga.",
                              "better": {
                                "title": "Jak możesz odpowiedzieć lepiej?",
                                "example": "Ja też tęsknię. Odkładajmy telefony przy kolacji – a gdy praca naprawdę wezwie, powiem Ci o tym.",
                                "reasons": [
                                  "Deklaracja jest jasna i bez zastrzeżeń.",
                                  "Wyjątki są nazwane z góry, więc nie zaskakują."
                                ]
                              }
                            }
                          }
                        },
                        {
                          "id": "31275df4-36e9-473f-b952-cd8bf44312e2",
                          "text": "To może Ty też odłożysz swój telefon, co?",
                          "is_correct": false,
                          "explanation": {
                            "title": "Na czym polegał błąd?",
                            "body": "Rozmowa szła w dobrą stronę, a ta odpowiedź odwraca uwagę od problemu i przerzuca część winy. Nawet jeśli to prawda, w tym momencie zabrzmi jak kontratak.",
                            "points": [],
                            "widget": null
                          },
                          "next": {
                            "id": "b77e2f5d-de59-4a93-ac25-7463835d4744",
                            "message": "Serio? Mówię Ci, że mi smutno, a Ty szukasz mojej winy?",
                            "options": [],
                            "conclusion": {
                              "title": "Czas na wnioski",
                              "body": "Odbijanie piłeczki w ostatniej chwili potrafi zniszczyć dobrą rozmowę. Jeśli chcesz, żeby coś zmieniło się także po drugiej stronie, zaproponuj to jako wspólną zasadę – „oboje”, a nie „Ty też”.",
                              "better": {
                                "title": "Jak możesz odpowiedzieć lepiej?",
                                "example": "Ja też tęsknię. Może umówimy się, że przy kolacji oboje odkładamy telefony?",
                                "reasons": [
                                  "„Oboje” zamiast „Ty też” – wspólna zasada zamiast zarzutu.",
                                  "Odpowiadasz na smutek, a nie na winę.",
                                  "Rozmowa kończy się planem."
                                ]
                              }
                            }
                          }
                        }
                      ],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "",
                          "reasons": [
                            "",
                            ""
                          ]
                        }
                      }
                    }
                  },
                  {
                    "id": "b28b6044-458a-4792-8c5d-752d0b31b2cf",
                    "text": "Przesadzasz, przecież zawsze Cię słucham.",
                    "is_correct": false,
                    "explanation": {
                      "title": "Na czym polegał błąd?",
                      "body": "„Przesadzasz” unieważnia uczucia drugiej osoby, a „zawsze” zamyka dyskusję. To defensywność, która mówi: Twój problem nie istnieje.",
                      "points": [
                        "Unieważnianie uczuć",
                        "Uogólnienie „zawsze”"
                      ],
                      "widget": null
                    },
                    "next": {
                      "id": "955fb754-9c8f-4d79-8315-867570d3cc9a",
                      "message": "No właśnie o tym mówię. Nawet teraz mnie nie słuchasz.",
                      "options": [],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "Zaprzeczając, potwierdzasz to, o czym mówi druga osoba – że nie czuje się słuchana. Nawet jeśli Twoim zdaniem słuchasz, ważniejsze jest to, jak ona to odczuwa.",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "Przykro mi, że tak to odbierasz. Masz rację, czasem odpływam w telefon.",
                          "reasons": [
                            "Uznajesz uczucia, zamiast z nimi dyskutować.",
                            "Bierzesz odpowiedzialność za konkretne zachowanie."
                          ]
                        }
                      }
                    }
                  },
                  {
                    "id": "84827350-13f3-4cdc-bb8f-dd07bbeef420",
                    "text": "Wieczorem po prostu muszę odpocząć, wiesz, jak jest.",
                    "is_correct": false,
                    "explanation": {
                      "title": "Na czym polegał błąd?",
                      "body": "Twoja potrzeba odpoczynku jest prawdziwa, ale podana w tym momencie brzmi jak wymówka. Druga osoba mówi o samotności, a słyszy, że telefon jest ważniejszy.",
                      "points": [],
                      "widget": {
                        "variant": "info",
                        "text": "Twoje potrzeby też się liczą. Warto o nich powiedzieć **po tym**, jak druga osoba poczuje się wysłuchana."
                      }
                    },
                    "next": {
                      "id": "c0722bda-3433-4ca1-94d0-868d5f2e7f88",
                      "message": "Czyli odpoczywasz ode mnie? Super.",
                      "options": [],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "Wymówka zamiast uznania zostawia drugą osobę z poczuciem odrzucenia. Najpierw odnieś się do jej uczuć, a dopiero potem opowiedz o swojej potrzebie odpoczynku – wtedy łatwiej znaleźć rozwiązanie dla Was obojga.",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "Przykro mi, że tak się czujesz. Wieczorami potrzebuję chwili dla siebie, ale może najpierw pogadamy przy kolacji?",
                          "reasons": [
                            "Najpierw uznanie, potem własna potrzeba.",
                            "Propozycja godzi potrzeby obu stron.",
                            "Nie ma wymówek ani zarzutów."
                          ]
                        }
                      }
                    }
                  }
                ],
                "conclusion": {
                  "title": "Czas na wnioski",
                  "body": "",
                  "better": {
                    "title": "Jak możesz odpowiedzieć lepiej?",
                    "example": "",
                    "reasons": [
                      "",
                      ""
                    ]
                  }
                }
              }
            },
            {
              "id": "2fbaaecb-f6e3-4524-b051-6859406a6e7e",
              "text": "Znowu się czepiasz. Przecież tylko sprawdzam wiadomości.",
              "is_correct": false,
              "explanation": {
                "title": "Na czym polegał błąd?",
                "body": "„Znowu się czepiasz” to krytyka, a „tylko sprawdzam” umniejsza problem. Druga osoba odważyła się powiedzieć o czymś trudnym i od razu usłyszała, że to jej wina.",
                "points": [
                  "Krytyka zamiast wysłuchania",
                  "Umniejszanie problemu"
                ],
                "widget": null
              },
              "next": {
                "id": "be4ab05c-ace5-49fd-b4d1-c61072b4ac4a",
                "message": "Nie czepiam się. Po prostu brakuje mi Ciebie. Ale skoro tak to odbierasz, to może nie ma sensu rozmawiać.",
                "options": [
                  {
                    "id": "32cfe68d-d3f0-470b-aca3-229d7a624928",
                    "text": "Przepraszam, to było niepotrzebne. Chcę Cię wysłuchać – powiedz, czego Ci brakuje.",
                    "is_correct": true,
                    "explanation": {
                      "title": "Dlaczego to działa?",
                      "body": "To **próba naprawy** – Gottman pokazał, że pary, które potrafią przerwać eskalację i wrócić do rozmowy, radzą sobie z konfliktami znacznie lepiej. Przeprosiny i zaproszenie do rozmowy otwierają drzwi na nowo.",
                      "points": [],
                      "widget": {
                        "variant": "golden",
                        "text": "Nie musisz prowadzić rozmowy bezbłędnie. Liczy się to, czy **potrafisz wrócić na właściwe tory**."
                      }
                    },
                    "next": {
                      "id": "7e294278-7b02-4030-8aed-bd903b928106",
                      "message": "Dziękuję. Brakuje mi naszych wieczornych rozmów, takich jak kiedyś.",
                      "options": [],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "Pierwsza reakcja była obronna, ale udało Ci się ją naprawić. To bardzo cenna umiejętność – mimo to warto ćwiczyć, by od początku odpowiadać z ciekawością zamiast z irytacją.",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "Dobrze, że o tym mówisz. Opowiesz mi, kiedy najbardziej to czujesz?",
                          "reasons": [
                            "Od razu zapraszasz do rozmowy zamiast się bronić.",
                            "Druga osoba nie musi walczyć o to, by zostać wysłuchaną."
                          ]
                        }
                      }
                    }
                  },
                  {
                    "id": "0ec386ee-9395-48d6-84a0-04d1cbf3fe0c",
                    "text": "No to nie rozmawiajmy.",
                    "is_correct": false,
                    "explanation": {
                      "title": "Na czym polegał błąd?",
                      "body": "To mur milczenia. Zamiast złapać szansę na naprawę, zamykasz rozmowę – a problem zostaje i wróci przy następnej okazji, zwykle silniejszy.",
                      "points": [
                        "Wycofanie zamiast naprawy"
                      ],
                      "widget": null
                    },
                    "next": {
                      "id": "9ac731d3-3575-49c5-af98-6f7c437a17bb",
                      "message": "…Dobranoc.",
                      "options": [],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "Rozmowa skończyła się, zanim się zaczęła. Druga osoba zostaje z poczuciem, że jej potrzeby się nie liczą. Gdy czujesz złość, lepiej poprosić o przerwę i wrócić do tematu, niż zamknąć go na dobre.",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "Przepraszam, poniosło mnie. Daj mi 10 minut, a potem chętnie porozmawiam.",
                          "reasons": [
                            "Nazywasz swoją reakcję i bierzesz za nią odpowiedzialność.",
                            "Przerwa z konkretnym czasem powrotu to nie ucieczka.",
                            "Druga osoba wie, że temat nie znika."
                          ]
                        }
                      }
                    }
                  },
                  {
                    "id": "f0c4856d-0d17-4d16-93f0-1acb968a9188",
                    "text": "Proszę, telefon odłożony. Teraz lepiej?",
                    "is_correct": false,
                    "explanation": {
                      "title": "Na czym polegał błąd?",
                      "body": "Formalnie spełniasz prośbę, ale ton jest sarkastyczny. To odcień pogardy – druga osoba czuje się raczej upokorzona niż wysłuchana.",
                      "points": [],
                      "widget": {
                        "variant": "remember",
                        "text": "**Ton ma znaczenie.** To samo działanie zrobione z sarkazmem rani bardziej niż brak działania."
                      }
                    },
                    "next": {
                      "id": "561f614e-9ed2-446b-9ec4-d248b11ceaba",
                      "message": "Nie o to mi chodziło. Nie chcę niczego wymuszać.",
                      "options": [],
                      "conclusion": {
                        "title": "Czas na wnioski",
                        "body": "Sarkastyczne ustępstwo nie rozwiązuje problemu, tylko dokłada nową ranę. Druga osoba nie chce wygrać sporu o telefon – chce poczuć, że jest dla Ciebie ważna.",
                        "better": {
                          "title": "Jak możesz odpowiedzieć lepiej?",
                          "example": "Masz rację, poniosło mnie. Odkładam telefon, bo chcę z Tobą pogadać.",
                          "reasons": [
                            "Przyznajesz się do błędu bez sarkazmu.",
                            "Działanie wynika z chęci, a nie z przymusu."
                          ]
                        }
                      }
                    }
                  }
                ],
                "conclusion": {
                  "title": "Czas na wnioski",
                  "body": "",
                  "better": {
                    "title": "Jak możesz odpowiedzieć lepiej?",
                    "example": "",
                    "reasons": [
                      "",
                      ""
                    ]
                  }
                }
              }
            },
            {
              "id": "ed3b08ce-50fe-4e65-b382-3a75e13c9cad",
              "text": "Mhm, zaraz, tylko dokończę jedną rzecz.",
              "is_correct": false,
              "explanation": {
                "title": "Na czym polegał błąd?",
                "body": "Odpowiadając w trakcie scrollowania, potwierdzasz dokładnie to, o czym mówi druga osoba. Ten moment był zaproszeniem do rozmowy, a odpowiedź pokazała, że telefon ma pierwszeństwo.",
                "points": [
                  "Brak kontaktu w ważnym momencie",
                  "Nieświadome potwierdzenie zarzutu"
                ],
                "widget": {
                  "variant": "info",
                  "text": "Gottman nazywa takie momenty **zaproszeniami do kontaktu**. Pary, które na nie odpowiadają, są znacznie szczęśliwsze."
                }
              },
              "next": {
                "id": "58f5edab-6667-4e59-a292-5053c94fa313",
                "message": "No właśnie. Nieważne.",
                "options": [],
                "conclusion": {
                  "title": "Czas na wnioski",
                  "body": "Najprostszy sposób, by pokazać drugiej osobie, że jest ważna, to oderwać się od telefonu, gdy chce porozmawiać. Odłożenie go na bok i spojrzenie w oczy mówi więcej niż jakiekolwiek słowa.",
                  "better": {
                    "title": "Jak możesz odpowiedzieć lepiej?",
                    "example": "Jasne, już odkładam telefon. Słucham Cię.",
                    "reasons": [
                      "Od razu reagujesz na zaproszenie do rozmowy.",
                      "Pokazujesz, że druga osoba jest ważniejsza niż ekran."
                    ]
                  }
                }
              }
            }
          ],
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "",
            "better": {
              "title": "Jak możesz odpowiedzieć lepiej?",
              "example": "",
              "reasons": [
                "",
                ""
              ]
            }
          }
        },
        "result": {
          "success": {
            "title": "Rozmowa poprowadzona bezbłędnie",
            "body": "Od początku do końca reagujesz z ciekawością i troską. Tak wygląda rozmowa, która naprawdę zbliża."
          },
          "failure": {
            "title": "To nie były najlepsze odpowiedzi",
            "body": "W tej rozmowie pojawiły się reakcje obronne lub chłodne. Sprawdź, które momenty można było poprowadzić inaczej."
          }
        }
      }
    },
    {
      "id": "d65f89fb-48cc-4ef1-92bc-fc4499301ca6",
      "block_type": "exercise-i-message",
      "config": {
        "context": {
          "title": "Bałagan po remoncie",
          "body": "Po weekendowym malowaniu przedpokoju farby, pędzle i folia od trzech dni leżą w salonie. Bliska osoba obiecała, że wszystko posprząta. Właśnie pisze do Ciebie z pracy."
        },
        "partner_message": "Wracam dziś później, mamy spotkanie do 19. Kupić coś na kolację?",
        "hint": null,
        "steps": [
          {
            "id": "e20de991-82a7-4d01-bc15-c0b9e9542085",
            "title": "Wybierz obserwację",
            "subtitle": "Jaki opis sytuacji przedstawia suchy fakt, bez ocen i uogólnień?",
            "options": [
              {
                "id": "e5bd2bba-21bb-41f1-9ffa-21731cf694f6",
                "label": "Kiedy od trzech dni w salonie leżą farby i folia po malowaniu…",
                "description": "Konkretny czas i konkretne rzeczy.",
                "is_correct": true,
                "explanation": "Opisujesz to, co widać, z dokładnym czasem. Nie ma tu oceny osoby ani domysłów na temat jej intencji."
              },
              {
                "id": "9d0ecea7-0f27-4bc1-b5eb-4a4df8010a22",
                "label": "Kiedy znowu zostawiasz po sobie syf…",
                "description": "",
                "is_correct": false,
                "explanation": "„Znowu” uogólnia, a „syf” to ocena nasycona emocjami. Druga osoba usłyszy atak, zanim dotrze do niej, o co chodzi."
              },
              {
                "id": "79538da7-a9de-4084-92d3-63d4ceb2d0c6",
                "label": "Kiedy nie dotrzymujesz słowa…",
                "description": "",
                "is_correct": false,
                "explanation": "To ocena charakteru, a nie opis sytuacji. Brzmi jak oskarżenie o nieuczciwość i wywoła obronę."
              },
              {
                "id": "6c20f90d-146b-48a1-8e0b-7d6b831f85a3",
                "label": "Kiedy myślisz, że ja wszystko za Ciebie posprzątam…",
                "description": "Zgadywanie, co myśli druga osoba.",
                "is_correct": false,
                "explanation": "Czytanie w myślach to interpretacja, a nie obserwacja. Nie wiesz, co myśli druga osoba – możesz tylko opisać to, co widzisz."
              }
            ]
          },
          {
            "id": "40137003-1393-4443-9325-cc29c8f1ac33",
            "title": "Wybierz uczucie",
            "subtitle": "Które sformułowanie opisuje Twój stan emocjonalny, nie obwiniając drugiej strony?",
            "options": [
              {
                "id": "b3b692bd-ddb5-41a2-a925-881194d15a27",
                "label": "czuję frustrację i zmęczenie…",
                "description": "",
                "is_correct": true,
                "explanation": "Nazywasz dwie konkretne emocje, które są Twoje. Druga osoba może je zrozumieć bez poczucia, że jest atakowana."
              },
              {
                "id": "d239a1b2-1912-4b17-b096-cd16da39c471",
                "label": "czuję, że wszystko jest na mojej głowie…",
                "description": "",
                "is_correct": false,
                "explanation": "To raczej myśl niż uczucie – i ukryty zarzut. Za tym zdaniem kryje się prawdopodobnie zmęczenie lub poczucie osamotnienia; nazwij je wprost."
              },
              {
                "id": "76163c15-0604-4476-b4b4-2a6c0182c0eb",
                "label": "mam ochotę wyrzucić to wszystko przez okno…",
                "description": "",
                "is_correct": false,
                "explanation": "To opis impulsu, a nie uczucia. Może rozbawić albo zabrzmieć jak groźba – w żadnym wypadku nie mówi jasno, co się z Tobą dzieje."
              }
            ]
          },
          {
            "id": "9663e993-0326-4ee0-80ad-d3752251c75f",
            "title": "Wybierz potrzebę",
            "subtitle": "Jaka Twoja uniwersalna potrzeba kryje się pod tymi emocjami?",
            "options": [
              {
                "id": "55e1e11c-50f7-47a2-818f-dae181900c74",
                "label": "bo potrzebuję porządku i odpoczynku po pracy…",
                "description": "",
                "is_correct": true,
                "explanation": "To Twoje uniwersalne potrzeby. Mówisz, co jest Ci potrzebne, zamiast wytykać, czego druga osoba nie zrobiła."
              },
              {
                "id": "e7683b5a-8a26-49ae-b32b-92dbc770e6d9",
                "label": "bo obietnic trzeba dotrzymywać…",
                "description": "",
                "is_correct": false,
                "explanation": "To zasada moralna, a nie potrzeba. Brzmi jak pouczanie i stawia Cię w roli sędziego."
              },
              {
                "id": "7c0a6587-daaa-4be2-856f-3e855f0c204c",
                "label": "bo nie mam zamiaru sprzątać za kogoś…",
                "description": "",
                "is_correct": false,
                "explanation": "To ultimatum, a nie potrzeba. Druga osoba usłyszy przede wszystkim złość i odmowę."
              }
            ]
          },
          {
            "id": "3eacb1f6-d5fb-4a11-8469-afa866a19602",
            "title": "Wybierz prośbę",
            "subtitle": "O jakie konkretne, możliwe do wykonania działanie chcesz poprosić?",
            "options": [
              {
                "id": "bd535428-7f11-4bfe-aa96-6ce9c616197a",
                "label": "Czy możesz dziś po powrocie schować farby i pędzle do piwnicy?",
                "description": "",
                "is_correct": true,
                "explanation": "Prośba jest konkretna, ma termin i jasno opisuje działanie. Druga osoba wie dokładnie, co zrobić, i może się zgodzić albo zaproponować inny czas."
              },
              {
                "id": "d2a3914a-7ebb-4a8f-b22f-fc80eba7f2c1",
                "label": "Ogarnij to wreszcie.",
                "description": "",
                "is_correct": false,
                "explanation": "Polecenie z wyrzutem („wreszcie”) to nie prośba. Nie wiadomo też, co dokładnie znaczy „ogarnij”."
              },
              {
                "id": "da36cbf5-ae75-49ae-a181-0dbf86865311",
                "label": "Może kiedyś coś z tym zrobisz?",
                "description": "",
                "is_correct": false,
                "explanation": "Pytanie brzmi jak prośba, ale jest sarkastyczne i niekonkretne. „Kiedyś” nie wyznacza żadnego terminu."
              },
              {
                "id": "14049551-62b8-4caa-b875-355cb8b187bb",
                "label": "Kup po drodze worki na śmieci.",
                "description": "Konkretna, ale czy na temat?",
                "is_correct": false,
                "explanation": "To konkretna prośba, ale nie dotyczy problemu, o którym mówisz. Druga osoba nie połączy jej z bałaganem w salonie."
              }
            ]
          }
        ],
        "success": {
          "result": {
            "title": "To był dobry komunikat JA",
            "body": "Udało Ci się poruszyć drażliwy temat bez oskarżeń. Taka wiadomość ma dużą szansę zostać dobrze przyjęta."
          },
          "explanation": {
            "title": "Wyjaśnienie",
            "body": "Codzienne sprawy, takie jak sprzątanie, to najczęstsze źródło kłótni w związkach. Właśnie dlatego warto mówić o nich **spokojnie i konkretnie** – zanim frustracja urośnie do rozmiarów wielkiej awantury."
          },
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "Drobne sprawy omawiane na bieżąco nie zamieniają się w lawinę pretensji. Komunikat JA sprawdza się tak samo przy dużych, jak i przy małych tematach.",
            "remember": {
              "variant": "golden",
              "text": "Mów o drobnych sprawach **od razu i życzliwie**. Odkładane na później wybuchają w najmniej odpowiednim momencie."
            }
          }
        },
        "failure": {
          "result": {
            "title": "To nie był dobry komunikat JA",
            "body": "Część Twoich wyborów zawierała oceny, domysły lub polecenia. Zobacz, jak zbudować tę wiadomość lepiej."
          },
          "explanation": {
            "title": "Wyjaśnienie",
            "body": "W codziennych sporach łatwo sięgnąć po skróty: „znowu”, „wreszcie”, „ogarnij”. Każde z tych słów niesie zarzut, który przykrywa prawdziwą treść prośby.\n**Komunikat JA** zastępuje zarzut opisem faktów, uczuć i potrzeb."
          },
          "conclusion": {
            "title": "Czas na wnioski",
            "body": "Frustracja z powodu bałaganu jest zupełnie naturalna. Kluczem jest wyrażenie jej tak, by druga osoba usłyszała prośbę, a nie atak.",
            "remember": null,
            "better_title": "Tak mogła brzmieć Twoja odpowiedź",
            "reasons": {
              "title": "Dlaczego to działa?",
              "points": [
                "Fakty zamiast ocen nie dają pola do sporu.",
                "Nazwane uczucia budzą empatię, a nie obronę.",
                "Konkretna prośba z terminem jest łatwa do spełnienia.",
                "Druga osoba może odpowiedzieć bez poczucia winy."
              ]
            }
          }
        }
      }
    },
    {
      "id": "5ec72b2e-4bcb-4e0c-a372-3f3a4a73bea7",
      "block_type": "exercise-quiz",
      "config": {
        "instruction": "Zaznacz wszystkie prawidłowe odpowiedzi.",
        "question": "Które elementy tworzą dobry komunikat JA?",
        "image": null,
        "options": [
          {
            "id": "5988041c-2c30-4027-998f-df862da14f56",
            "text": "Obserwacja konkretnego zachowania",
            "is_correct": true,
            "explanation": "Tak. Obserwacja opisuje sytuację tak, jak nagrałaby ją kamera – bez ocen i uogólnień."
          },
          {
            "id": "200ed502-e406-4e4f-80b1-a61839befcb7",
            "text": "Nazwanie własnego uczucia",
            "is_correct": true,
            "explanation": "Tak. Mówienie o własnych emocjach zamiast o winie drugiej osoby to serce komunikatu JA."
          },
          {
            "id": "23aa8981-1a5b-40f9-8599-9cd59765e937",
            "text": "Przypomnienie wcześniejszych błędów",
            "is_correct": false,
            "explanation": "Wyciąganie starych spraw zamienia rozmowę w rozliczenie. Komunikat JA dotyczy jednej, aktualnej sytuacji."
          },
          {
            "id": "5dd915d8-31ac-42da-bc51-425a8a64e7de",
            "text": "Konkretna prośba",
            "is_correct": true,
            "explanation": "Tak. Prośba wskazuje, co druga osoba może zrobić, i nadaje rozmowie kierunek."
          },
          {
            "id": "60ba1d01-e01a-4112-bc18-ff62197f2659",
            "text": "Ocena intencji drugiej osoby",
            "is_correct": false,
            "explanation": "Zgadywanie intencji („robisz to specjalnie”) to interpretacja, która wywołuje obronę. Mów o tym, co widzisz, a nie o tym, co myślisz o czyichś motywach."
          },
          {
            "id": "2a74437d-355f-4475-9fe6-4a573714920a",
            "text": "Słowa „zawsze” i „nigdy” dla podkreślenia problemu",
            "is_correct": false,
            "explanation": "Uogólnienia nie podkreślają problemu, tylko go wyolbrzymiają. Druga osoba zacznie szukać wyjątków, zamiast słuchać."
          }
        ],
        "remember": {
          "variant": "remember",
          "text": "Cztery kroki komunikatu JA: **obserwacja, uczucie, potrzeba, prośba**. Nie ma w nich miejsca na oceny – i właśnie dlatego działają."
        }
      }
    },
    {
      "id": "509ddd08-6980-4d83-a5e5-36e77e089850",
      "block_type": "knowledge-view",
      "config": {
        "elements": [
          {
            "id": "ff6bc021-17dd-4080-b77d-807e8624d851",
            "type": "heading",
            "level": 1,
            "text": "Podsumowanie"
          },
          {
            "id": "5b589792-9461-43cb-a6c1-1eb37000f947",
            "type": "paragraph",
            "text": "Gratulacje! Masz za sobą cały moduł o komunikacji w związku. Zanim przejdziesz dalej, zatrzymaj się na chwilę przy **najważniejszych wnioskach**."
          },
          {
            "id": "be6361cf-210d-408e-be70-c35237eefc60",
            "type": "section-title",
            "icon": "good",
            "text": "Co warto zabrać ze sobą?"
          },
          {
            "id": "f19b092e-b6b6-49d3-981b-7b958f0869fb",
            "type": "list",
            "marker": "check",
            "items": [
              "Zaczynaj trudne rozmowy łagodnie",
              "Oddzielaj fakty od własnych interpretacji",
              "Zamiast się bronić, szukaj części racji drugiej strony",
              "Mów o uczuciach i potrzebach, a nie o winie"
            ]
          },
          {
            "id": "7467b7d3-2bba-4f54-bce5-fb5d1509b87b",
            "type": "heading",
            "level": 2,
            "text": "Twój plan na najbliższy tydzień"
          },
          {
            "id": "b16342f0-3fc8-4965-9692-1a4876eece33",
            "type": "steps",
            "steps": [
              {
                "id": "4ca9c623-3336-4578-9414-abd73ffff19f",
                "title": "Zauważ",
                "text": "Wyłap jeden moment, w którym masz ochotę skrytykować albo się bronić."
              },
              {
                "id": "5792c9bc-1319-409e-baba-08239fb8f81a",
                "title": "Zatrzymaj się",
                "text": "Weź oddech i nazwij w myślach swoje uczucie."
              },
              {
                "id": "9f9d72a7-57a7-41e7-9329-592c4b305da1",
                "title": "Spróbuj",
                "text": "Powiedz to samo w formie komunikatu JA."
              }
            ]
          },
          {
            "id": "1a1f3d02-647d-4bed-b236-4980fabc8b09",
            "type": "chat-example",
            "message": "Jak minął Ci dzień?",
            "reply": "Szczerze? Ciężko. Potrzebuję się przytulić i chwilę ponarzekać – posłuchasz?",
            "verdict": "good"
          },
          {
            "id": "75ac9ef9-de8f-4a41-94fa-b38f7b0cec90",
            "type": "image-text",
            "image_side": "left",
            "image": {
              "media_id": null
            },
            "text": "Komunikacja to umiejętność, a nie talent. **Każda rozmowa** jest okazją do ćwiczenia – także ta, która nie wyszła."
          },
          {
            "id": "77271436-45b9-4534-b9b8-6bc1dbc9971d",
            "type": "callout",
            "variant": "golden",
            "text": "Nie chodzi o to, by nigdy się nie kłócić. Chodzi o to, by **kłócić się tak, żeby po rozmowie być bliżej**, a nie dalej."
          },
          {
            "id": "e2fc9ac5-3766-4503-942f-7b184df0e34a",
            "type": "paragraph",
            "text": "{fioletowy}Dziękujemy, że jesteś z nami.{/} Do zobaczenia w kolejnym module!"
          }
        ]
      }
    }
  ]
}$flow$::jsonb, 1, now())
  ON CONFLICT (module_id) DO UPDATE
    SET flow_data  = EXCLUDED.flow_data,
        revision   = public.module_drafts.revision + 1,
        updated_at = now();

  RAISE NOTICE 'Utworzono moduł „%” (id: %).', v_title, v_module_id;
END
$seed$;

-- Kontrola: moduł nieopublikowany, 19 widoków, liczba widoków każdego typu.
SELECT m.id,
       m.title,
       m.live_version_id IS NULL                   AS nieopublikowany,
       jsonb_array_length(d.flow_data -> 'views')  AS widoki,
       (SELECT jsonb_object_agg(t.block_type, t.n)
          FROM (SELECT v ->> 'block_type' AS block_type, count(*) AS n
                  FROM jsonb_array_elements(d.flow_data -> 'views') v
                 GROUP BY 1) t)                    AS bloki
  FROM public.modules m
  JOIN public.module_drafts d ON d.module_id = m.id
 WHERE m.title = 'Komunikacja w związku';
