let CARD_W = 200
let CARD_H = 300

var cp = null
var cpd = null
var cph = null
var cpf = null

var non_playable_cause = null

function i_at(e, k)
{
    return yeGetInt(yeGet(e, k))
}

function add_i_at(e, k, v)
{
    yeAddInt(yeGet(e, k), v)
}

function draw_card(paw)
{
    var card = yeLast(cpd)
    if(yeNbElems(cph) > 7)
	return
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
    print("X: ", x)
    var can = ywCanvasNewImgFromTexture(paw, x + 30 * hidx,
					i_at(cp, "hand_y"), txt,
					null)
    ywCanvasRotate(can, angle)
    ywCanvasForceSizeXY(can, CARD_W / 2, CARD_H / 2)
    print("weight: ", x + 30 * hidx)
    ywCanvasSetWeight(paw, can, (hidx + 1) * wm)
    yePushBack(card, can, "can")
    yeCreateInt(hidx, can, "hidx")
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
    let wc = i_at(scard, "wealth_cost")

    if (i_at(scard, "type") == 0 && yeNbElems(cpf) > 6) {
	non_playable_cause = "TOO MUCH GUYS ON THE FIELD"
	return false
    }
    non_playable_cause = "NOT ENOUGH WEALTH :("
    return wc <= wealth
}

function paw_action(paw, eves)
{
    let mouse_r = ywRectCreateInts(yeveMouseX(), yeveMouseY(), 1, 1)
    let phase = i_at(paw, "phase")
    let cur_player = i_at(paw, "cur_player")
    let turn = i_at(paw, "turn")
    let p0 = yeGet(paw, "p0")
    let p1 = yeGet(paw, "p1")

    if (cur_player == 0) {
	cp = p0
    } else {
	cp = p1
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
		yuiUsleep(30000)
		ygUpdateScreen()
	    }
	else
	    draw_card(paw)
    }

    /* unkeep */
    if (phase == 0) {
	add_i_at(cp, "wealth", i_at(cp, "wealth-turn"))
	add_i_at(paw, "phase", 1)
    }

    if (i_at(paw, "cur_player") == 1) {
	print("play le mechant")
	add_i_at(paw, "turn", 1)
	yeSetIntAt(paw, "phase", 0)
	yeSetIntAt(paw, "cur_player", 0)
	yuiUsleep(100000)
	ygUpdateScreen()
	return;
    }

    if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1) &&
	ywCanvasCheckColisionsRectObj(mouse_r, yeGet(cp, "deck_c"))) {
	print("deck click !", yeLen(cpd), yeLen(cph),
	      yeLastKey(cpd), yeLastKey(cph))
    }

    if (yeGet(paw, "hover_c") != null) {
	ywCanvasRemoveObj(paw, yeGet(paw, "hover_c"))
	yeRemoveChildByStr(paw, "hover_c")
    }

    let cols = ywCanvasNewCollisionsArrayWithRectangle(paw, mouse_r)

    for (var i = 0; (c = yeGet(cols, i)) != null; ++i) {
	if (yeGet(c, "turn-end") && yevCheckKeys(eves, YKEY_MOUSEDOWN, 1)) {
	    yeSetIntAt(paw, "phase", 0)
	    yeSetIntAt(paw, "cur_player", 1)
	    return
	}
    }

    let hover_card = yeLast(cols)

    if (hover_card != null && yeGet(hover_card, "hidx") != null &&
	yeveMouseY() > 300) {
	var scard = yeGet(cph, i_at(hover_card, "hidx"))

	var txt = yeGet(scard, "texture")
	var hover_c = ywCanvasNewImgFromTexture(paw, 0, 0, txt, null)
	yePushBack(paw, hover_c, "hover_c")

	if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1)) {
	    let wc = i_at(scard, "wealth_cost")
	    let cc = i_at(scard, "citizen_cost")

	    if (is_card_playable(scard, wealth)) {
		var hcan = yeGet(scard, "can")
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

		    print("fidx: ", fidx)
		    var can = ywCanvasNewImgFromTexture(paw, 110 * fidx + 3,
							i_at(cp, "field_y"), txt,
							null)
		    ywCanvasForceSizeXY(can, CARD_W / 2, CARD_H / 2)
		    ywCanvasSetWeight(paw, can, 0)
		    yeCreateInt(fidx, can, "fidx")
		    yePushBack(scard, can, "can")
		}

		yeRemoveChildByEntity(cph, scard)
	    } else {
		global_txt += "\n" + non_playable_cause
	    }
	    print("must play card :)", wc, cc)
	}
    } else if (hover_card != null && yeGet(hover_card, "fidx") != null) {
	print("fidx !!!!", i_at(hover_card, "fidx"))
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
m * This function should be callable from outside of the module
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

function paw_init(paw)
{
    yeCreateFunction(paw_action, paw, "action")
    yeCreateString("rgba: 255 255 255 255", paw, "background")
    var cards = ygFileToEnt(YJSON, "./cards.json")
    yePushBack(paw, cards, "cards")
    var deck = ygFileToEnt(YJSON, "./greek_deck.json")

    ret = ywidNewWidget(paw, "canvas")
    ywCanvasEnableWeight(paw)
    ywCanvasNewRectangle(paw, 0, 300, 800, 1, "rgba: 0 0 0 100")
    for (i = 0; i < yeLen(cards); ++i) {
	let img_path = yeGetKeyAt(cards, i) + ".png"
	mk_card(yeGet(cards, i), yeGetKeyAt(cards, i))
	var img = null
	var imgt = yeGet(yeGet(cards, i), "texture")

	print("=====\n", yent_to_str(imgt), "\n====")
	//img = ywCanvasNewImgFromTexture(paw, 10, i * 110, imgt, null)
	//ywCanvasForceSize(img, sz)


    }
    var wid_size = yeGet(paw, "wid-pix")
    var wid_h = ywRectH(wid_size)
    var wid_w = ywRectW(wid_size)
    let back = mk_card_back()
    var sz = ywSizeCreate(CARD_W / 2, CARD_H / 2)

    yeCreateInt(0, paw, "turn")
    yeCreateInt(0, paw, "phase")
    yeCreateInt(0, paw, "cur_player")

    var p = create_player(paw, "p1", deck)

    var back_c = ywCanvasNewImgFromTexture(paw, 30, 0, back, null)
    ywCanvasForceSize(back_c, sz)
    ywCanvasRotate(back_c, 180)
    yePushBack(p, back_c, "deck_c")
    yeCreateInt(10, p, "hand_y")
    yeCreateInt(40, p, "field_y")

    p = create_player(paw, "p0", deck)
    yeCreateInt(420, p, "hand_y")
    yeCreateInt(310, p, "field_y")
    back_c = ywCanvasNewImgFromTexture(paw, 660, 420, back, null)
    ywCanvasForceSize(back_c, sz)
    yePushBack(p, back_c, "deck_c")

    var end_turn = ywCanvasNewRectangle(paw, 700, 10, 80, 80, "rgba: 255 0 0 190")
    ywCanvasNewTextByStr(paw, 700, 35, "End Turn")
    yeCreateInt(1, end_turn, "turn-end")

    return ret;
}

function mod_init(mod)
{
    var paw = yeCreateArray()

    yeCreateFunction(paw_init, paw, "callback")
    yeCreateString("polis-at-war", paw, "name")
    yeIncrRef(paw)
    ywidAddSubType(paw)

    var sw = yeCreateArray(mod, "starting widget")
    yeCreateString("polis-at-war", sw, "<type>")

    var sz = ywSizeCreate(800, 600)

    yePushBack(mod, sz, "window size")
    return mod
}
