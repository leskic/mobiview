# encoding: UTF-8

require "json"

module MobiViewExporter

  module KnowledgeBase

    extend self

    ############################################################
    # BANCO
    ############################################################

    FILE = File.join(__dir__, "mobiview_knowledge.json")

    ############################################################
    # CARREGAR
    ############################################################

    def load

      unless File.exist?(FILE)

        return {

          version:1,

          exports:0,

          projects:[],

          attributes:{},

          definitions:{},

          dinabox_types:{},

          materials:{},

          modules:{}

        }

      end

      JSON.parse(File.read(FILE), symbolize_names:true)

    end

    ############################################################
    # SALVAR
    ############################################################

    def save(db)

      File.open(FILE,"w:utf-8") do |f|

        f.write(

          JSON.pretty_generate(db)

        )

      end

    end

    ############################################################
    # APRENDER
    ############################################################

    def learn(model,pieces)

      db = load

      db[:exports] += 1

      db[:projects] << {

        name:model.title,

        guid:model.guid,

        date:Time.now.strftime("%Y-%m-%d %H:%M:%S"),

        pieces:pieces.size

      }

      pieces.each do |piece|

        learn_piece(

          db,

          piece

        )

      end

      save(db)

    end

    ############################################################
    # PEÇA
    ############################################################

    def learn_piece(db,piece)

      ########################################

      name = piece[:name]

      if name

        db[:definitions][name] ||= 0

        db[:definitions][name] += 1

      end

      ########################################

      if piece[:material]

        db[:materials][piece[:material]] ||= 0

        db[:materials][piece[:material]] += 1

      end

      ########################################

      if piece[:module_id]

        db[:modules][piece[:module_id]] ||= 0

        db[:modules][piece[:module_id]] += 1

      end

      ########################################

      if piece[:dinabox]

        type = piece[:dinabox][:type]

        if type

          db[:dinabox_types][type] ||= 0

          db[:dinabox_types][type] += 1

        end

      end

      ########################################

      if piece[:dynamic_attributes]

        piece[:dynamic_attributes].each do |k,v|

          db[:attributes][k] ||= {

            count:0,

            samples:[]

          }

          db[:attributes][k][:count]+=1

          samples=db[:attributes][k][:samples]

          unless samples.include?(v)

            samples << v

          end

          samples.shift while samples.size>5

        end

      end

    end

  end

end