
/**        DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *                   Version 2, December 2004
 *
 * Copyright (C) 2021 Matthias Gatto <matthias.gatto@protonmail.com>
 *
 * Everyone is permitted to copy and distribute verbatim or modified
 * copies of this license document, and changing it is allowed as long
 * as the name is changed.
 *
 *            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
 *
 *  0. You just DO WHAT THE FUCK YOU WANT TO.
 */

/* 
 * I've try to use this file as an example who to use my engine with js and canvas
 * most of my engine use an abstract type call entity, that are use to represent any kind of data
 * and are used everywhere in my engine and games.
 * Stat reading at mod init so at the end of the file :)
 */

let CARD_W = 200
let CARD_H = 300

/*  */
var cp = null /* current player */
var op = null /* other player */
var cpd = null /* current player deck */
var cph = null /* current player hand */
var cpf = null /* current player field */
var card_rotation = 0 /* 0 for player, 180 for enemy, is set at turn start */

var looser = 0 /* who lose (0 no one) */

var non_playable_cause = null /* string that store why a card can't be played */

var slash_path = "./slash.png"

/*
 * simple helper: yeGetInt, get number from an Int Entity
 * yeGet: get sub entity of an array entity
 * this function get an integer from an elements of an array
 * @return interger value of sub elemt of e at k 
 */
function i_at(e, k)
{
    return yeGetInt(yeGet(e, k))
}

/* 
 * Addition an integer to an element of an array entity
 * like e[k] += v but e is an entity.
 */
function add_i_at(e, k, v)
{
    yeAddInt(yeGet(e, k), v)
}

/* remove "hover_c" from screen and paw widget entity */
function deprint_card(paw)
{
    if (yeGet(paw, "hover_c") != null) {
	ywCanvasRemoveObj(paw, yeGet(paw, "hover_c"))
	yeRemoveChildByStr(paw, "hover_c")
    }
}

/* show a slash on screen, wait and remove it */
function slash(paw, x, y)
{
    /* create canvas obj using slash_path */
    var slash = ywCanvasNewImgByPath(paw, x, y, slash_path);

    /* ask YIRL to rend all widget (and thefore print objects that have been push to the canvas) */
    ygUpdateScreen()
    /* wait */
    yuiUsleep(300000)
    /* remove the image and reprint all */
    ywCanvasRemoveObj(paw, slash);
    ygUpdateScreen()
}

/* remove card from battle field and screen */
function rm_card(paw, f, c)
{
    /* get canvas obj from card */
    let can = yeGet(c, "can")
    /* get pos */
    let pos = ywCanvasObjPos(can)

    /* show a slash to explicit the card attack */
    slash(paw, ywPosX(pos), ywPosY(pos))
    /* remove object from screen */
    ywCanvasRemoveObj(paw, can)
    /* remove card entity from field entity */
    yeRemoveChildByEntity(f, c)
    /* update screen */
    ygUpdateScreen()
    yuiUsleep(300000)
}

/* try to attack with a card */
/* if the card is tap, return */
/* else try to find if the oponent have an untap card */
/* if so attack the untap card */
/* else go for the eye... enemy life, Boo...m (but I'm listening to BG ost) */
function attack(paw, card)
{
    if (i_at(card, "tap") == 1)
	return

    var can = yeGet(card, "can")

    deprint_card(paw)
    yeSetIntAt(card, "tap", 1)
    ywCanvasRotate(can, card_rotation + 90)

    ygUpdateScreen()
    yuiUsleep(300000)

    var atk_val = i_at(card, "atk")
    var def_val = i_at(card, "def")
    var opf = yeGet(op, "field")
    var defender = null

    for (var i = 0; i < yeLen(opf); ++i) {
	ocard = yeGet(opf, i)
	if (ocard && i_at(ocard, "tap") == 0) {
	    defender = ocard
	    break
	}
    }

    if (defender == null) {
	add_i_at(op, "citizens", -atk_val)
	print("cur player: !!!! ", i_at(paw, "cur_player"),
	      i_at(paw, "cur_player") == 1)
	if (i_at(paw, "cur_player") == 1)
	    slash(paw, 660, 420)
	else
	    slash(paw, 30, 0)
    } else {
	aat = i_at(defender, "atk")
	adt = i_at(defender, "def")

	if (aat >= def_val) {
	    rm_card(paw, cpf, card)
	}
	if (atk_val >= adt) {
	    rm_card(paw, opf, defender)
	}
    }
}

function draw_card(paw)
{
    if (yeLen(cpd) == 0) {
	looser = i_at(paw, "cur_player") + 1
	return
    }

    var card = yeLast(cpd)
    if(yeNbElems(cph) > 7)
	return
    var name = yeLastKey(cpd)
    var hidx = yePush(cph, card, yeLastKey(cpd))
    var x = 30
    var angle = 0
    var wm = 1
    yePopBack(cpd)

    let txt = null
    if (i_at(paw, "cur_player") == 0) {
	txt = yeGet(card, "texture")
	angle = 10 * hidx - 30
    } else {
	angle = 210 - 15 * hidx
	txt = mk_card_back()
	x += 400
	wm = -1
    }
    var can = ywCanvasNewImgFromTexture(paw, x + 30 * hidx,
					i_at(cp, "hand_y"), txt,
					null)
    ywCanvasRotate(can, angle)
    ywCanvasForceSizeXY(can, CARD_W / 2, CARD_H / 2)
    print("weight: ", x + 30 * hidx)
    ywCanvasSetWeight(paw, can, (hidx + 1) * wm)
    yePushBack(card, can, "can")
    yeCreateInt(hidx, can, "hidx")
    yeCreateString(name, card, "name")
    ygUpdateScreen()
}

function phase_to_str(phase)
{
    if (phase == 0)
	return "unkeep phase"
    else if (phase == 1)
	return "main phase"
    return "unknow phase"
}

function is_card_playable(scard, wealth)
{
    if (scard == null)
	return false
    let wc = i_at(scard, "wealth_cost")

    if (i_at(scard, "type") == 0 && yeNbElems(cpf) > 6) {
	non_playable_cause = "TOO MUCH GUYS ON THE FIELD"
	return false
    }
    non_playable_cause = "NOT ENOUGH WEALTH :("
    return wc <= wealth
}

function print_card(paw, scard)
{
    var txt = yeGet(scard, "texture")
    var hover_c = ywCanvasNewImgFromTexture(paw, 0, 0, txt, null)

    yePushBack(paw, hover_c, "hover_c")
}

function play_card(paw, scard)
{
    var hcan = yeGet(scard, "can")
    let wc = i_at(scard, "wealth_cost")
    let cc = i_at(scard, "citizen_cost")

    ywCanvasRemoveObj(paw, hcan)
    yeRemoveChildByStr(scard, "can")
    yeRemoveChildByStr(scard, "hidx")
    print("oh: ", i_at(cp, "wealth"))
    add_i_at(cp, "wealth", -wc)
    add_i_at(cp, "citizens", -cc)
    if (i_at(scard, "type") == 1) {
	add_i_at(cp, "wealth-turn", i_at(scard, "gen_wealth"))
    } else if (i_at(scard, "type") == 0) {
	var fidx = yePush(cpf, scard)
	let txt = yeGet(scard, "texture")

	var can = ywCanvasNewImgFromTexture(paw, 110 * fidx + 3,
					    i_at(cp, "field_y"), txt,
					    null)
	ywCanvasForceSizeXY(can, CARD_W / 2, CARD_H / 2)
	ywCanvasRotate(can, card_rotation)
	ywCanvasSetWeight(paw, can, 0)
	yeCreateInt(fidx, can, "fidx")
	yePushBack(scard, can, "can")
    }

    yeRemoveChildByEntity(cph, scard)
}

/* this function is automatically called by YIRL,
 * there is 2 paradigme YIRL can use to rend object:
 *
 * 1rst is to use how widget should work:
 * each widgets have an action callbback, which take in parameters game events
 * modify what the widget sould print.
 * all callbacks are called then YIRL print all widgets, and re call the callback
 * (basically YIRL have a loop that call, action callbacks and print everything)
 *
 * 2nd paradigme: 1 widget take ownershit of the screen:
 * the action callback is called a first time, but them the callback doesn't
 * return durring all the widget lifecycle and monopolise the screen.
 * this widget do kind of an old mix of both:
 * it monopolise the screen durring enemy turn, and when animation happen,
 * but use the normal way of returning to get events
 */
function paw_action(paw, eves)
{
    let mouse_r = ywRectCreateInts(yeveMouseX(), yeveMouseY(), 1, 1)
    let phase = i_at(paw, "phase")
    let cur_player = i_at(paw, "cur_player")
    let turn = i_at(paw, "turn")
    let p0 = yeGet(paw, "p0")
    let p1 = yeGet(paw, "p1")

    if (cur_player == 0) {
	card_rotation = 0
	cp = p0
	op = p1
    } else {
	card_rotation = 180
	cp = p1
	op = p0
    }
    cpd = yeGet(cp, "deck")
    cph = yeGet(cp, "hand")
    cpf = yeGet(cp, "field")
    var wealth = i_at(cp, "wealth")
    var citizens = i_at(cp, "citizens")
    var global_txt = "Turn: " + turn + " Player: " + cur_player +
	" " + phase_to_str(phase) +
	"\nGood Guy: Wealth: " + i_at(p0, "wealth") +
	" Pop: " + i_at(p0, "citizens") +
	" Income: " + i_at(p0, "wealth-turn") +
	"\nBad Guy: Wealth: " + i_at(p1, "wealth") +
	" Pop: " + i_at(p1, "citizens") +
	" Income: " + i_at(p1, "wealth-turn")


    if (phase == 0) {
	if (turn == 0)
	    for(var i = 0; i < 5; ++i) {
		draw_card(paw)
		ygUpdateScreen()
		yuiUsleep(30000)
	    }
	else
	    draw_card(paw)
    }

    if (i_at(p0, "citizens") < 1)
	looser = 2;
    else if (i_at(p1, "citizens") < 1)
	looser = 1;

    if (looser > 0) {
	let txt = "Player " + (looser - 1) + " WIN !!!"
	ywCanvasNewTextByStr(paw, 200, 200, txt)
	ywCanvasNewTextByStr(paw, 200, 260, txt)
	ywCanvasNewTextByStr(paw, 200, 340, txt)
	ygUpdateScreen()
	yuiUsleep(2000000)
	if (yeGet(paw, "quit"))
	    yesCall(yeGet(paw, "quit"), paw)
	else
	    yesCall(ygGet("FinishGame"))
	return;
    }

    /* unkeep */
    if (phase == 0) {
	for (var i = 0; i < yeLen(cpf); ++i) {
	    let card = yeGet(cpf, i)

	    yeSetIntAt(card, "tap", 0)
	    let can = yeGet(card, "can")
	    ywCanvasRotate(can, card_rotation)
	}
	add_i_at(cp, "wealth", i_at(cp, "wealth-turn"))
	add_i_at(paw, "phase", 1)
    }

    if (i_at(paw, "cur_player") == 1) {
	print("play le mechant")
	print("AI, yume no ai")
	yuiUsleep(100000)
	ygUpdateScreen()

	for (var i = 0; i < yeLen(cph); ++i) {
	    var scard = yeGet(cph, i)
	    print("playable: ", is_card_playable(scard, wealth))
	    if (is_card_playable(scard, i_at(cp, "wealth"))) {
		play_card(paw, scard)
	    }
	}

	for (var i = 0; i < yeLen(cpf); ++i) {
	    var card = yeGet(cpf, i)

	    if (card && i_at(card, "tap") < 1 && yuiRand() & 1) {
		attack(paw, card)
	    }
	}

	yeSetIntAt(cp, "wealth", 0)
	add_i_at(paw, "turn", 1)
	yeSetIntAt(paw, "phase", 0)
	yeSetIntAt(paw, "cur_player", 0)

	return;
    }

    if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1) &&
	ywCanvasCheckColisionsRectObj(mouse_r, yeGet(cp, "deck_c"))) {
	print("deck click !", yeLen(cpd), yeLen(cph),
	      yeLastKey(cpd), yeLastKey(cph))
    }

    deprint_card(paw)

    let cols = ywCanvasNewCollisionsArrayWithRectangle(paw, mouse_r)

    for (var i = 0; (c = yeGet(cols, i)) != null; ++i) {
	if (yeGet(c, "turn-end") && yevCheckKeys(eves, YKEY_MOUSEDOWN, 1)) {
	    yeSetIntAt(paw, "phase", 0)
	    yeSetIntAt(paw, "cur_player", 1)
	    yeSetIntAt(cp, "wealth", 0)
	    return
	}
    }

    let hover_card = yeLast(cols)

    if (hover_card != null && yeGet(hover_card, "hidx") != null &&
	yeveMouseY() > 300) {
	var scard = yeGet(cph, i_at(hover_card, "hidx"))

	print_card(paw, scard)

	if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1)) {
	    if (is_card_playable(scard, wealth)) {
		play_card(paw, scard)
	    } else {
		global_txt += "\n" + non_playable_cause
	    }
	}
    } else if (hover_card != null && yeGet(hover_card, "fidx") != null &&
	       yeveMouseY() > 300) {
	var scard = yeGet(cpf, i_at(hover_card, "fidx"))

	print_card(paw, scard)
	if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1)) {
	    attack(paw, scard)
	}
    } else if (hover_card != null && yeGet(hover_card, "fidx") != null) {
	var scard = yeGet(yeGet(p1, "field"), i_at(hover_card, "fidx"))

	print_card(paw, scard)
    }

    ywCanvasRemoveObj(paw, yeGet(paw, "global_text"))
    yeRemoveChildByStr(paw, "global_text")
    let global_txt_c = ywCanvasNewTextByStr(paw, 200, 0, global_txt)
    yePushBack(paw, global_txt_c, "global_text")
}

function mk_card_back(father, name)
{
    let sz = ywSizeCreate(CARD_W, CARD_H)
    let ret = ywTextureNew(sz, father, name)

    ywTextureMergeRectangle(ret, 0, 0, CARD_W, CARD_H,
			    "rgba: 0 0 0 255")
    ywTextureMergeRectangle(ret, 2, 2, CARD_W - 4, CARD_H - 4,
			    "rgba: 127 30 70 255")
    ywTextureMergeText(ret, 30, 130, CARD_W, 30, "Polis At War")
    return ret
}

/*
 * This function should be callable from outside of the module
 * Take a card description and return create image in it
 */
function mk_card(card, card_name)
{
    let sz = ywSizeCreate(CARD_W, CARD_H)
    let imd_dst = ywRectCreateInts(25, 40, 150, 150)
    let imd_src = null
    var ret = ywTextureNew(sz, card, "texture")
    var gc_crasp = yeCreateArray()
    let img_path = card_name + ".png"
    var cost = ""

    ywTextureMergeRectangle(ret, 0, 0, ywSizeW(sz), ywSizeH(sz),
			    "rgba: 0 0 0 255")
    ywTextureMergeRectangle(ret, 2, 2, ywSizeW(sz) - 4, ywSizeH(sz) - 4,
			    "rgba: 127 127 127 255")

    var itxt = ywTextureNewImg(img_path, null, gc_crasp, null)
    ywTextureMergeTexture(itxt, ret, imd_src, imd_dst)
    if (i_at(card, "wealth_cost"))
	cost += i_at(card, "wealth_cost") + "$ "
    if (i_at(card, "citizen_cost"))
	cost += i_at(card, "citizen_cost") + "Citizens"
    ywTextureMergeText(ret, 4, 20, CARD_W, 30, cost)

    if (i_at(card, "type") == 0) {
	let atk_txt = i_at(card, "atk") + " / " + i_at(card, "def")

	ywTextureMergeText(ret, 130, 270, 70, 30,  atk_txt)
    } else if (i_at(card, "type") == 1) {
	let income_txt = "increase income: " + i_at(card, "gen_wealth")

	ywTextureMergeText(ret, 5, 210, 70, 30,  income_txt)
    }

    yeCreateInt(0, card, "tap")
    ywTextureMergeText(ret, 4, 2, CARD_W, 30, card_name)
    return ret
}

function create_player(paw, name, deck)
{
    var p = yeCreateArray(paw, name)

    var p_deck = yeCreateArray(p, "deck")
    yeCreateArray(p, "hand")
    yeCreateArray(p, "graveyard")
    yeCreateArray(p, "field")
    yeCreateInt(0, p, "wealth")
    yeCreateInt(1, p, "wealth-turn")
    yeCreateInt(20, p, "citizens")

    var cards = yeGet(paw, "cards")
    var cp_deck = yeCreateCopy(deck)
    var tot_cards = 0
    for (i = 0; i < yeLen(cp_deck); ++i) {
	var cards_nb = yeGet(cp_deck, i)
	tot_cards += yeGetInt(cards_nb)
    }

    while (tot_cards > 0) {
	var deck_idx = yuiRand() % yeLen(cp_deck)
	var cards_nb = yeGet(cp_deck, deck_idx)

	if (yeGetInt(cards_nb) > 0) {
	    let cname = yeGetKeyAt(cp_deck, deck_idx)
	    yeAddInt(cards_nb, -1)
	    tot_cards--;
	    let ocard = yeGet(cards, cname)
	    let copy = yeCreateCopy(ocard, p_deck, cname)
	    let copy_txt = yeGet(copy, "texture")
	    ocard_txt = yeGet(ocard, "texture")
	    yePushBack(copy_txt, yeGet(ocard_txt, "$img-surface"), "$img-surface")
	}
    }
    return p
}

function paw_destroy(paw)
{
    ygModDirOut();
}

/* take the widget array entity, and init it */
function paw_init(paw)
{
    /* go to the module directory, useful to use images dynamoc paths */
    ygModDir("polis-at-war");
    /* create destroy and action function the widget */
    yeCreateFunction(paw_destroy, paw, "destroy")
    yeCreateFunction(paw_action, paw, "action")
    /* set background color, note, that background could have an image path too */
    yeCreateString("rgba: 255 255 255 255", paw, "background")
    /* load the json containing the cards description into cards variable */
    var cards = ygFileToEnt(YJSON, "./cards.json")
    /* push cards into the widget */
    yePushBack(paw, cards, "cards")
    /* load the deck descriptions */
    var deck = ygFileToEnt(YJSON, "./greek_deck.json")

    /* create the entity, tell YIRL the entity is based on the canvas type
     * (so yirl will call canvas init internaly) */
    ret = ywidNewWidget(paw, "canvas")
     /* enable weight on the widget, otherwise we couldn't choose which object is on top of another */
    ywCanvasEnableWeight(paw)
    
    /* create a line that server as separation for the players */
    ywCanvasNewRectangle(paw, 0, 300, 800, 1, "rgba: 0 0 0 100")

    /* init all cards */
    for (i = 0; i < yeLen(cards); ++i) {
	let img_path = yeGetKeyAt(cards, i) + ".png"
	mk_card(yeGet(cards, i), yeGetKeyAt(cards, i))
	/* debug print */
	var img = null
	var imgt = yeGet(yeGet(cards, i), "texture")

	print("=====\n", yent_to_str(imgt), "\n====")
	//img = ywCanvasNewImgFromTexture(paw, 10, i * 110, imgt, null)
	//ywCanvasForceSize(img, sz)


    }
    /* get widget pixiel size from widget array entity */
    var wid_size = yeGet(paw, "wid-pix")
    /* get height and width from wid_size */
    var wid_h = ywRectH(wid_size)
    var wid_w = ywRectW(wid_size)
    /* create back of the card texture */
    let back = mk_card_back()
    var sz = ywSizeCreate(CARD_W / 2, CARD_H / 2)

    /* init some value and push thoses into the widget entity */
    yeCreateInt(0, paw, "turn")
    yeCreateInt(0, paw, "phase")
    yeCreateInt(0, paw, "cur_player")

    /* create p1 (the bad guy) return an entity entity that have been push into paw */
    var p = create_player(paw, "p1", deck)

    /*
     * create a printable object from back (which is a texture)
     * Position of the object are x: 30, y: 0, it reprsent the deck of the player
     */
    var back_c = ywCanvasNewImgFromTexture(paw, 30, 0, back, null)
    /* set the size of the object */
    ywCanvasForceSize(back_c, sz)
    /* U turn */
    ywCanvasRotate(back_c, 180)
    /* push the canvas obj into player entity, so it will be easier to manipulate it */
    yePushBack(p, back_c, "deck_c")
    yeCreateInt(10, p, "hand_y")
    yeCreateInt(130, p, "field_y")

    /* create the good guy */
    p = create_player(paw, "p0", deck)
    yeCreateInt(420, p, "hand_y")
    yeCreateInt(310, p, "field_y")
    back_c = ywCanvasNewImgFromTexture(paw, 660, 420, back, null)
    ywCanvasForceSize(back_c, sz)
    yePushBack(p, back_c, "deck_c")
    /* ^ same as for the bag guy, but for the good guy */

    /* Create a rectangle, and a text canvas object, in order to create a butter to end turn */
    var end_turn = ywCanvasNewRectangle(paw, 700, 10, 80, 80, "rgba: 255 0 0 190")
    ywCanvasNewTextByStr(paw, 700, 35, "End Turn")
    yeCreateInt(1, end_turn, "turn-end")

    return ret;
}

/* module starting point
 * mod is an array entity representing the module
 */
function mod_init(mod)
{
   /*
    * create an array entity that will be use to define a new
    * type of widget call "polis-at-war"
    */
    var paw = yeCreateArray()

    /*
     * create a function entity that have as value the js function "paw_init"
     * push it into paw array, with "callback" as key
     */
    yeCreateFunction(paw_init, paw, "callback")
     /* create an entity string "polis-at-war", push it into paw, "name" as array key */
    yeCreateString("polis-at-war", paw, "name")
     /* Crappy internal uglyness */
    yeIncrRef(paw)
     /* tell YIRL that a new sub widget type existe
      * it's define by paw variable
      * the new type is call "polis-at-war", and when a widget of that sub-type
      * is created paw_init is called to init the widget
      */
    ywidAddSubType(paw)

    var sw = yeCreateArray(mod, "starting widget")
    yeCreateString("polis-at-war", sw, "<type>")

    var sz = ywSizeCreate(800, 600)

    yePushBack(mod, sz, "window size")
    /* 
     * above lines that push stuff into 'mob' init the mod array entity
     * json form of mod should now be:
     * { "starting widget" : {"<type>": "polis-at-war"}, "window size": [800, 600] }
     */
	
    return mod
}
